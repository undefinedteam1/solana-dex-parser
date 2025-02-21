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
import { processTransferInnerInstruction } from "../transfer-utils";
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
    return this.txWithMeta.transaction.message.instructions.reduce(
      (events: PoolEvent[], instruction: any, index: number) => {
        let event: PoolEvent | null = null;
        const programId = instruction.programId.toBase58();
        switch (programId) {
          case DEX_PROGRAMS.METEORA.id:
            event = new MeteoraDLMMPoolParser(
              this.txWithMeta,
              this.splTokenMap,
              this.splDecimalsMap,
            ).parseInstruction(instruction, index);
            break;
          case DEX_PROGRAMS.METEORA_POOLS.id:
            event = new MeteoraPoolsPoolParser(
              this.txWithMeta,
              this.splTokenMap,
              this.splDecimalsMap,
            ).parseInstruction(instruction, index);
            break;
        }
        if (event) {
          events.push(event);
        }
        return events;
      },
      [],
    );
  }
}

class MeteoraDLMMPoolParser {
  constructor(
    private readonly txWithMeta: ParsedTransactionWithMeta,
    private readonly splTokenMap: Map<string, TokenInfo>,
    private readonly splDecimalsMap: Map<string, number>,
  ) {}

  public getPoolAction(data: any): PoolEventType | null {
    const instructionType = data.slice(0, 8);

    if (instructionType.equals(DISCRIMINATORS.METEORA_DLMM.ADD_LIQUIDITY)) {
      return "ADD";
    } else if (
      instructionType.equals(DISCRIMINATORS.METEORA_DLMM.REMOVE_LIQUIDITY)
    ) {
      return "REMOVE";
    }
    return null;
  }

  public parseInstruction(
    instruction: PartiallyDecodedInstruction,
    index: number,
  ): PoolEvent | null {
    try {
      const data = base58.decode(instruction.data as string);
      const instructionType = this.getPoolAction(data);

      if (!instructionType) return null;

      const transfers = processTransferInnerInstruction(
        this.txWithMeta,
        index,
        this.splTokenMap,
        this.splDecimalsMap,
      );

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
    const [poolPc, poolCoin] = transfers;
    const coinMint = poolCoin?.info.mint || instruction.accounts[8].toString();
    const pcMint = poolPc?.info.mint || instruction.accounts[7].toString();
    const programId = instruction.programId.toBase58();
    return {
      ...getPoolEventBase("ADD", this.txWithMeta, programId),
      idx: index.toString(),
      poolId: instruction.accounts[1].toString(),
      poolLpMint: instruction.accounts[1].toString(),
      poolCoinMint: coinMint,
      poolPcMint: pcMint,
      coinAmount:
        poolCoin?.info.tokenAmount.uiAmount ||
        convertToUiAmount(
          data.readBigUInt64LE(16),
          this.splDecimalsMap.get(coinMint),
        ),
      pcAmount:
        poolPc?.info.tokenAmount.uiAmount ||
        convertToUiAmount(
          data.readBigUInt64LE(8),
          this.splDecimalsMap.get(pcMint),
        ),
    };
  }

  private parseRemoveLiquidityEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: any,
    transfers: TransferData[],
  ): PoolEvent {
    let [poolPc, poolCoin]: any[] = transfers;
    if (transfers.length == 1) {
      if (isSupportedToken(transfers[0].info.mint)) {
        poolCoin = transfers[0];
        poolPc = undefined;
      }
    }
    const coinMint = poolCoin?.info.mint || instruction.accounts[8].toString();
    const pcMint = poolPc?.info.mint || instruction.accounts[7].toString();
    const programId = instruction.programId.toBase58();
    return {
      ...getPoolEventBase("REMOVE", this.txWithMeta, programId),
      idx: index.toString(),
      poolId: instruction.accounts[1].toString(),
      poolLpMint: instruction.accounts[1].toString(),
      poolCoinMint: coinMint,
      poolPcMint: pcMint,
      coinAmount: poolCoin?.info.tokenAmount.uiAmount || 0,
      pcAmount: poolPc?.info.tokenAmount.uiAmount || 0,
    };
  }
}

class MeteoraPoolsPoolParser {
  constructor(
    private readonly txWithMeta: ParsedTransactionWithMeta,
    private readonly splTokenMap: Map<string, TokenInfo>,
    private readonly splDecimalsMap: Map<string, number>,
  ) {}

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
  ): PoolEvent | null {
    try {
      const data = base58.decode(instruction.data as string);
      const instructionType = this.getPoolAction(data);

      if (!instructionType) return null;

      const transfers = processTransferInnerInstruction(
        this.txWithMeta,
        index,
        this.splTokenMap,
        this.splDecimalsMap,
        ["mintTo", "burn"],
      );

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
    const [poolPc, poolCoin] = transfers.filter((it) =>
      it.type.includes("transfer"),
    );
    const [, , lpCoin] = transfers.filter((it) => it.type == "mintTo");
    const coinMint = poolCoin?.info.mint || instruction.accounts[4].toString();
    const pcMint = poolPc?.info.mint || instruction.accounts[3].toString();
    const programId = instruction.programId.toBase58();
    return {
      ...getPoolEventBase("CREATE", this.txWithMeta, programId),
      idx: index.toString(),
      poolId: instruction.accounts[0].toString(),
      poolLpMint: instruction.accounts[2].toString(),
      poolCoinMint: coinMint,
      poolPcMint: pcMint,

      coinAmount:
        poolCoin?.info.tokenAmount.uiAmount ||
        convertToUiAmount(
          data.readBigUInt64LE(16),
          this.splDecimalsMap.get(coinMint),
        ),
      pcAmount:
        poolPc?.info.tokenAmount.uiAmount ||
        convertToUiAmount(
          data.readBigUInt64LE(8),
          this.splDecimalsMap.get(pcMint),
        ),
      lpAmount: lpCoin?.info.tokenAmount.uiAmount || 0,
    };
  }

  private parseAddLiquidityEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: any,
    transfers: TransferData[],
  ): PoolEvent {
    const [poolPc, poolCoin] = transfers.filter((it) =>
      it.type.includes("transfer"),
    );
    const [, , lpCoin] = transfers.filter((it) => it.type == "mintTo");
    const coinMint = poolCoin?.info.mint;
    const pcMint = poolPc?.info.mint;
    const programId = instruction.programId.toBase58();
    return {
      ...getPoolEventBase("ADD", this.txWithMeta, programId),
      idx: index.toString(),
      poolId: instruction.accounts[0].toString(),
      poolLpMint: instruction.accounts[1].toString(),
      poolCoinMint: coinMint,
      poolPcMint: pcMint,
      coinAmount:
        poolCoin?.info.tokenAmount.uiAmount ||
        convertToUiAmount(
          data.readBigUInt64LE(24),
          this.splDecimalsMap.get(coinMint),
        ),
      pcAmount:
        poolPc?.info.tokenAmount.uiAmount ||
        convertToUiAmount(
          data.readBigUInt64LE(16),
          this.splDecimalsMap.get(pcMint),
        ),
      lpAmount:
        lpCoin?.info.tokenAmount.uiAmount ||
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
    const [poolPc, poolCoin] = transfers.filter((it) =>
      it.type.includes("transfer"),
    );
    const [, , lpCoin] = transfers.filter((it) => it.type == "burn");
    const coinMint = poolCoin?.info.mint;
    const pcMint = poolPc?.info.mint;
    const programId = instruction.programId.toBase58();
    return {
      ...getPoolEventBase("REMOVE", this.txWithMeta, programId),
      idx: index.toString(),
      poolId: instruction.accounts[0].toString(),
      poolLpMint: instruction.accounts[1].toString(),
      poolCoinMint: coinMint,
      poolPcMint: pcMint,
      coinAmount:
        poolCoin?.info.tokenAmount.uiAmount ||
        convertToUiAmount(
          data.readBigUInt64LE(24),
          this.splDecimalsMap.get(coinMint),
        ),
      pcAmount:
        poolPc?.info.tokenAmount.uiAmount ||
        convertToUiAmount(
          data.readBigUInt64LE(16),
          this.splDecimalsMap.get(pcMint),
        ),
      lpAmount:
        lpCoin?.info.tokenAmount.uiAmount ||
        convertToUiAmount(
          data.readBigUInt64LE(8),
          this.splDecimalsMap.get(instruction.accounts[1].toString()),
        ),
    };
  }
}
