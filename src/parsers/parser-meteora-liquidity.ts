import {
  ParsedTransactionWithMeta,
  PartiallyDecodedInstruction,
} from "@solana/web3.js";
import { DEX_PROGRAMS, DISCRIMINATORS } from "../constants";
import {
  convertToUiAmount,
  PoolEvent,
  PoolEventType,
  TokenInfo,
  TransferData,
} from "../types";
import { TokenInfoExtractor } from "../token-extractor";
import {
  getLPTransfers,
  processTransferInnerInstruction,
} from "../transfer-utils";
import base58 from "bs58";
import { getPoolEventBase, isSupportedToken } from "../utils";

export class MeteoraLiquidityParser {
  private readonly splTokenMap: Map<string, TokenInfo>;
  private readonly splDecimalsMap: Map<string, number>;

  constructor(private readonly txWithMeta: ParsedTransactionWithMeta) {
    const tokenExtractor = new TokenInfoExtractor(txWithMeta);
    this.splTokenMap = tokenExtractor.extractSPLTokenInfo();
    this.splDecimalsMap = tokenExtractor.extractDecimals();
  }

  public processLiquidity(): PoolEvent[] {
    const items = this.txWithMeta.transaction.message.instructions.reduce(
      (events: PoolEvent[], instruction: any, index: number) => {
        const event = this.processInstruction(instruction, index);
        if (event) {
          events.push(event);
        }
        return events;
      },
      [],
    );

    if (items.length == 0) {
      // try innerInstructions
      return this.processInnerInstructions();
    }

    return items;
  }

  private processInnerInstructions(): PoolEvent[] {
    try {
      const events: PoolEvent[] = [];
      this.txWithMeta.transaction.message.instructions.forEach(
        (instruction: any, outerIndex: number) => {
          events.push(...this.processInnerInstruction(outerIndex));
        },
      );
      return events;
    } catch (error) {
      console.error("Error processing Meteora trades:", error);
      return [];
    }
  }

  private processInnerInstruction(outerIndex: number): PoolEvent[] {
    const innerInstructions = this.txWithMeta.meta?.innerInstructions;
    if (!innerInstructions) return [];

    return innerInstructions
      .filter((set) => set.index === outerIndex)
      .flatMap((set) =>
        set.instructions
          .map((instruction, innerIndex) =>
            this.processInstruction(
              instruction,
              outerIndex,
              innerIndex
            ),
          )
          .filter((event): event is PoolEvent => event !== null),
      );
  }

  private processInstruction(instruction: any, outerIndex: number, innerIndex?: number) {
    let event: PoolEvent | null = null;
    const programId = instruction.programId.toBase58();
    switch (programId) {
      case DEX_PROGRAMS.METEORA.id:
        event = new MeteoraDLMMPoolParser(
          this.txWithMeta,
          this.splTokenMap,
          this.splDecimalsMap,
        ).parseInstruction(instruction, outerIndex, innerIndex);
        break;
      case DEX_PROGRAMS.METEORA_POOLS.id:
        event = new MeteoraPoolsPoolParser(
          this.txWithMeta,
          this.splTokenMap,
          this.splDecimalsMap,
        ).parseInstruction(instruction, outerIndex, innerIndex);
        break;
    }
    return event;
  }
}

class MeteoraDLMMPoolParser {
  constructor(
    private readonly txWithMeta: ParsedTransactionWithMeta,
    private readonly splTokenMap: Map<string, TokenInfo>,
    private readonly splDecimalsMap: Map<string, number>,
  ) { }

  public getPoolAction(data: any): PoolEventType | null {
    const instructionType = data.slice(0, 8);

    if (Object.values(DISCRIMINATORS.METEORA_DLMM.ADD_LIQUIDITY).find((it) => instructionType.equals(it))) {
      return "ADD";
    } else if (Object.values(DISCRIMINATORS.METEORA_DLMM.REMOVE_LIQUIDITY).find((it) => instructionType.equals(it))) {
      return "REMOVE";
    }

    return null;
  }

  public parseInstruction(
    instruction: PartiallyDecodedInstruction,
    index: number,
    innerIndex?: number
  ): PoolEvent | null {
    try {
      const data = base58.decode(instruction.data as string);
      const instructionType = this.getPoolAction(data);
  
      if (!instructionType) return null;

      const curIdx = innerIndex == undefined ? index.toString() : `${index}-${innerIndex}`;
      const accounts = instruction.accounts.map((it) => it.toBase58());
      const transfers = processTransferInnerInstruction(
        this.txWithMeta,
        index,
        this.splTokenMap,
        this.splDecimalsMap,
      ).filter((it) => accounts.includes(it.info.destination) && it.idx >= curIdx);

      switch (instructionType) {
        case "ADD":
          return this.parseAddLiquidityEvent(
            instruction,
            index,
            data,
            transfers,
          );
        case "REMOVE":
          return this.parseRemoveLiquidityEvent(
            instruction,
            index,
            data,
            transfers,
          );
      }

      return null;
    } catch (error) {
      console.error("parseInstruction error:", error);
      return null;
    }
  }

  private parseAddLiquidityEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: any,
    transfers: TransferData[],
  ): PoolEvent {
    let [token0, token1]: any[] = getLPTransfers(transfers);
    if (transfers.length == 1) {
      if (isSupportedToken(transfers[0].info.mint)) {
        token1 = transfers[0];
        token0 = undefined;
      }
    }
    const token0Mint = token0?.info.mint; // || instruction.accounts[7].toString();
    const token1Mint = token1?.info.mint;// || instruction.accounts[8].toString();
    const programId = instruction.programId.toBase58();
    return {
      ...getPoolEventBase("ADD", this.txWithMeta, programId),
      idx: index.toString(),
      poolId: instruction.accounts[1].toString(),
      poolLpMint: instruction.accounts[1].toString(),
      token0Mint: token0Mint,
      token1Mint: token1Mint,
      token0Amount: token0?.info.tokenAmount.uiAmount || 0,
      token1Amount: token1?.info.tokenAmount.uiAmount || 0,
    };
  }

  private parseRemoveLiquidityEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: any,
    transfers: TransferData[],
  ): PoolEvent {
    let [token0, token1]: any[] = getLPTransfers(transfers);
    if (transfers.length == 1) {
      if (isSupportedToken(transfers[0].info.mint)) {
        token1 = transfers[0];
        token0 = undefined;
      }
    }
    const token0Mint = token0?.info.mint || instruction.accounts[7].toString();
    const token1Mint = token1?.info.mint || instruction.accounts[8].toString();
    const programId = instruction.programId.toBase58();
    return {
      ...getPoolEventBase("REMOVE", this.txWithMeta, programId),
      idx: index.toString(),
      poolId: instruction.accounts[1].toString(),
      poolLpMint: instruction.accounts[1].toString(),
      token0Mint: token0Mint,
      token1Mint: token1Mint,
      token0Amount: token0?.info.tokenAmount.uiAmount || 0,
      token1Amount: token1?.info.tokenAmount.uiAmount || 0,
    };
  }
}

class MeteoraPoolsPoolParser {
  constructor(
    private readonly txWithMeta: ParsedTransactionWithMeta,
    private readonly splTokenMap: Map<string, TokenInfo>,
    private readonly splDecimalsMap: Map<string, number>,
  ) { }

  public getPoolAction(data: any): PoolEventType | null {
    const instructionType = data.slice(0, 8);

    if (instructionType.equals(DISCRIMINATORS.METEORA_POOLS.CREATE)) {
      return "CREATE";
    } else if (
      instructionType.equals(DISCRIMINATORS.METEORA_POOLS.ADD_LIQUIDITY)
    ) {
      return "ADD";
    } else if (
      instructionType.equals(DISCRIMINATORS.METEORA_POOLS.REMOVE_LIQUIDITY)
    ) {
      return "REMOVE";
    }
    return null;
  }

  public parseInstruction(
    instruction: PartiallyDecodedInstruction,
    index: number,
    innerIndex?: number
  ): PoolEvent | null {
    try {
      const data = base58.decode(instruction.data as string);
      const instructionType = this.getPoolAction(data);

      if (!instructionType) return null;

      const curIdx = innerIndex == undefined ? index.toString() : `${index}-${innerIndex}`;
      const accounts = instruction.accounts.map((it) => it.toBase58());
      const transfers = processTransferInnerInstruction(
        this.txWithMeta,
        index,
        this.splTokenMap,
        this.splDecimalsMap,
        ["mintTo", "burn"],
      ).filter((it) => accounts.includes(it.info.destination) && it.idx >= curIdx);

      switch (instructionType) {
        case "CREATE":
          return this.parseCreateLiquidityEvent(
            instruction,
            index,
            data,
            transfers,
          );
        case "ADD":
          return this.parseAddLiquidityEvent(
            instruction,
            index,
            data,
            transfers,
          );
        case "REMOVE":
          return this.parseRemoveLiquidityEvent(
            instruction,
            index,
            data,
            transfers,
          );
      }

      return null;
    } catch (error) {
      console.error("parseInstruction error:", error);
      return null;
    }
  }

  private parseCreateLiquidityEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: any,
    transfers: TransferData[],
  ): PoolEvent {
    const [token0, token1] = getLPTransfers(transfers);
    const [, , lpToken] = transfers.filter((it) => it.type == "mintTo");
    const token0Mint = token0?.info.mint || instruction.accounts[3].toString();
    const token1Mint = token1?.info.mint || instruction.accounts[4].toString();
    const programId = instruction.programId.toBase58();
    return {
      ...getPoolEventBase("CREATE", this.txWithMeta, programId),
      idx: index.toString(),
      poolId: instruction.accounts[0].toString(),
      poolLpMint: instruction.accounts[2].toString(),
      token0Mint: token0Mint,
      token1Mint: token1Mint,

      token0Amount:
        token0?.info.tokenAmount.uiAmount ||
        convertToUiAmount(
          data.readBigUInt64LE(16),
          this.splDecimalsMap.get(token0Mint),
        ),
      token1Amount:
        token1?.info.tokenAmount.uiAmount ||
        convertToUiAmount(
          data.readBigUInt64LE(8),
          this.splDecimalsMap.get(token1Mint),
        ),
      lpAmount: lpToken?.info.tokenAmount.uiAmount || 0,
    };
  }

  private parseAddLiquidityEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: any,
    transfers: TransferData[],
  ): PoolEvent {
    const [token0, token1] = getLPTransfers(transfers);
    const [, , lpToken] = transfers.filter((it) => it.type == "mintTo");

    const token0Mint = token0?.info.mint;
    const token1Mint = token1?.info.mint;
    const programId = instruction.programId.toBase58();
    return {
      ...getPoolEventBase("ADD", this.txWithMeta, programId),
      idx: index.toString(),
      poolId: instruction.accounts[0].toString(),
      poolLpMint: instruction.accounts[1].toString(),
      token0Mint: token0Mint,
      token1Mint: token1Mint,
      token0Amount:
        token0?.info.tokenAmount.uiAmount ||
        convertToUiAmount(
          data.readBigUInt64LE(24),
          this.splDecimalsMap.get(token0Mint),
        ),
      token1Amount:
        token1?.info.tokenAmount.uiAmount ||
        convertToUiAmount(
          data.readBigUInt64LE(16),
          this.splDecimalsMap.get(token1Mint),
        ),
      lpAmount:
        lpToken?.info.tokenAmount.uiAmount ||
        convertToUiAmount(
          data.readBigUInt64LE(8),
          this.splDecimalsMap.get(instruction.accounts[1].toString()),
        ),
    };
  }

  private parseRemoveLiquidityEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: any,
    transfers: TransferData[],
  ): PoolEvent {
    const [token0, token1] = getLPTransfers(transfers);
    const [, , lpToken] = transfers.filter((it) => it.type == "burn");
    const token0Mint = token0?.info.mint;
    const token1Mint = token1?.info.mint;
    const programId = instruction.programId.toBase58();
    return {
      ...getPoolEventBase("REMOVE", this.txWithMeta, programId),
      idx: index.toString(),
      poolId: instruction.accounts[0].toString(),
      poolLpMint: instruction.accounts[1].toString(),
      token0Mint: token0Mint,
      token1Mint: token1Mint,
      token0Amount:
        token0?.info.tokenAmount.uiAmount ||
        convertToUiAmount(
          data.readBigUInt64LE(24),
          this.splDecimalsMap.get(token0Mint),
        ),
      token1Amount:
        token1?.info.tokenAmount.uiAmount ||
        convertToUiAmount(
          data.readBigUInt64LE(16),
          this.splDecimalsMap.get(token1Mint),
        ),
      lpAmount:
        lpToken?.info.tokenAmount.uiAmount ||
        convertToUiAmount(
          data.readBigUInt64LE(8),
          this.splDecimalsMap.get(instruction.accounts[1].toString()),
        ),
    };
  }
}
