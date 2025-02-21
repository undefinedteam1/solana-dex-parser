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
import { getPoolEventBase } from "../utils";

export class RaydiumLiquidityParser {
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
          case DEX_PROGRAMS.RAYDIUM_V4.id:
            event = new RaydiumV4PoolParser(
              this.txWithMeta,
              this.splTokenMap,
              this.splDecimalsMap,
            ).parseRaydiumInstruction(instruction, index);
            break;
          case DEX_PROGRAMS.RAYDIUM_CL.id:
            event = new RaydiumCLPoolParser(
              this.txWithMeta,
              this.splTokenMap,
              this.splDecimalsMap,
            ).parseRaydiumInstruction(instruction, index);
            break;
          case DEX_PROGRAMS.RAYDIUM_CPMM.id:
            event = new RaydiumCPMMPoolParser(
              this.txWithMeta,
              this.splTokenMap,
              this.splDecimalsMap,
            ).parseRaydiumInstruction(instruction, index);
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

class RaydiumV4PoolParser {
  constructor(
    private readonly txWithMeta: ParsedTransactionWithMeta,
    private readonly splTokenMap: Map<string, TokenInfo>,
    private readonly splDecimalsMap: Map<string, number>,
  ) {}

  public getPoolAction(data: any): PoolEventType | null {
    const instructionType = data.slice(0, 8);

    if (instructionType.equals(DISCRIMINATORS.RAYDIUM.CREATE)) {
      return "CREATE";
    } else if (instructionType.equals(DISCRIMINATORS.RAYDIUM.ADD_LIQUIDITY)) {
      return "ADD";
    } else if (
      instructionType.equals(DISCRIMINATORS.RAYDIUM.REMOVE_LIQUIDITY)
    ) {
      return "REMOVE";
    }
    return null;
  }

  public parseRaydiumInstruction(
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
        case "CREATE":
          return this.parseCreateEvent(instruction, index, data, transfers);
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
      console.error("parseRaydiumInstruction error:", error);
      return null;
    }
  }

  private parseCreateEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: any,
    transfers: TransferData[],
  ): PoolEvent {
    const [poolCoin, poolPc] = transfers;
    const coinMint = poolCoin?.info.mint || instruction.accounts[8].toString();
    const pcMint = poolPc?.info.mint || instruction.accounts[9].toString();
    const programId = instruction.programId.toBase58();
    return {
      ...getPoolEventBase("CREATE", this.txWithMeta, programId),
      idx: index.toString(),
      poolId: instruction.accounts[4].toString(),
      poolLpMint: instruction.accounts[7].toString(),
      poolCoinMint: coinMint,
      poolPcMint: pcMint,
      // initialize2:
      // - 8 byte offset 1: DISCRIMINATORS
      // - 8 byte offset 1: nonce
      // - 64 byte offset 8: openTime
      // - 64 byte offset 8: pcAmount
      // - 64 byte offset 8: coinAmount
      // - others...
      coinAmount:
        poolCoin?.info.tokenAmount.uiAmount ||
        convertToUiAmount(
          data.readBigUInt64LE(18),
          this.splDecimalsMap.get(coinMint),
        ),
      pcAmount:
        poolPc?.info.tokenAmount.uiAmount ||
        convertToUiAmount(
          data.readBigUInt64LE(10),
          this.splDecimalsMap.get(pcMint),
        ),
    };
  }

  private parseAddLiquidityEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: any,
    transfers: TransferData[],
  ): PoolEvent | null {
    const [poolCoin, poolPc] = transfers;
    const programId = instruction.programId.toBase58();
    if (transfers.length >= 2) {
      return {
        ...getPoolEventBase("ADD", this.txWithMeta, programId),
        idx: index.toString(),
        poolId: instruction.accounts[1].toString(),
        poolLpMint: instruction.accounts[5].toString(),

        poolCoinMint: poolCoin?.info.mint,
        poolPcMint: poolPc?.info.mint,
        coinAmount:
          poolCoin?.info.tokenAmount.uiAmount ||
          convertToUiAmount(
            data.readBigUInt64LE(1),
            this.splDecimalsMap.get(poolCoin?.info.mint),
          ),
        pcAmount:
          poolPc?.info.tokenAmount.uiAmount ||
          convertToUiAmount(
            data.readBigUInt64LE(9),
            this.splDecimalsMap.get(poolPc?.info.mint),
          ),
      };
    }
    return null;
  }

  private parseRemoveLiquidityEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: any,
    transfers: TransferData[],
  ): PoolEvent {
    const lpAmount = convertToUiAmount(data.readBigUInt64LE(1).toString());
    const [poolCoin, poolPc] = transfers;
    const programId = instruction.programId.toBase58();
    return {
      ...getPoolEventBase("REMOVE", this.txWithMeta, programId),
      idx: index.toString(),
      poolId: instruction.accounts[1].toString(),
      poolLpMint: instruction.accounts[5].toString(),
      poolCoinMint: poolCoin?.info.mint,
      poolPcMint: poolPc?.info.mint,
      coinAmount: poolCoin?.info.tokenAmount.uiAmount || 0,
      pcAmount: poolPc?.info.tokenAmount.uiAmount || 0,
      lpAmount: lpAmount,
    };
  }
}

class RaydiumCLPoolParser {
  constructor(
    private readonly txWithMeta: ParsedTransactionWithMeta,
    private readonly splTokenMap: Map<string, TokenInfo>,
    private readonly splDecimalsMap: Map<string, number>,
  ) {}

  public getPoolAction(data: any): PoolEventType | null {
    const instructionType = data.slice(0, 8);

    if (instructionType.equals(DISCRIMINATORS.RAYDIUM_CL.CREATE)) {
      return "CREATE";
    } else if (
      instructionType.equals(DISCRIMINATORS.RAYDIUM_CL.ADD_LIQUIDITY)
    ) {
      return "ADD";
    } else if (
      instructionType.equals(DISCRIMINATORS.RAYDIUM_CL.REMOVE_LIQUIDITY)
    ) {
      return "REMOVE";
    }
    return null;
  }

  public parseRaydiumInstruction(
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
        case "CREATE":
          return this.parseCreateEvent(instruction, index, data, transfers);
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
      console.error("parseRaydiumInstruction error:", error);
      return null;
    }
  }

  private parseCreateEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: any,
    transfers: TransferData[],
  ): PoolEvent {
    const [poolPc, poolCoin] = transfers;
    const coinMint = poolCoin?.info.mint || instruction.accounts[19].toString();
    const pcMint = poolPc?.info.mint || instruction.accounts[18].toString();
    const programId = instruction.programId.toBase58();
    return {
      ...getPoolEventBase("CREATE", this.txWithMeta, programId),
      idx: index.toString(),
      poolId: instruction.accounts[4].toString(),
      poolLpMint: instruction.accounts[4].toString(),
      poolCoinMint: coinMint,
      poolPcMint: pcMint,

      // amount 1
      coinAmount:
        poolCoin?.info.tokenAmount.uiAmount ||
        convertToUiAmount(
          data.readBigUInt64LE(48),
          this.splDecimalsMap.get(coinMint),
        ),
      // amount 0
      pcAmount:
        poolPc?.info.tokenAmount.uiAmount ||
        convertToUiAmount(
          data.readBigUInt64LE(40),
          this.splDecimalsMap.get(pcMint),
        ),
      lpAmount: 0,
    };
  }

  private parseAddLiquidityEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: any,
    transfers: TransferData[],
  ): PoolEvent | null {
    const [poolPc, poolCoin] = transfers;
    const coinMint = poolCoin?.info.mint || instruction.accounts[14].toString();
    const pcMint = poolPc?.info.mint || instruction.accounts[13].toString();
    const programId = instruction.programId.toBase58();
    if (transfers.length >= 2) {
      return {
        ...getPoolEventBase("ADD", this.txWithMeta, programId),
        idx: index.toString(),
        poolId: instruction.accounts[2].toString(),
        poolLpMint: instruction.accounts[2].toString(),
        poolCoinMint: coinMint,
        poolPcMint: pcMint,
        // amount1
        coinAmount:
          poolCoin?.info.tokenAmount.uiAmount ||
          convertToUiAmount(
            data.readBigUInt64LE(32),
            this.splDecimalsMap.get(coinMint),
          ),
        // amount0
        pcAmount:
          poolPc?.info.tokenAmount.uiAmount ||
          convertToUiAmount(
            data.readBigUInt64LE(24),
            this.splDecimalsMap.get(pcMint),
          ),
        lpAmount:
          convertToUiAmount(
            data.readBigUInt64LE(8),
            this.splDecimalsMap.get(pcMint),
          ) || 0,
      };
    }
    return null;
  }

  private parseRemoveLiquidityEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: any,
    transfers: TransferData[],
  ): PoolEvent {
    const [poolPc, poolCoin] = transfers;
    const coinMint = poolCoin?.info.mint || instruction.accounts[15].toString();
    const pcMint = poolPc?.info.mint || instruction.accounts[14].toString();
    const programId = instruction.programId.toBase58();
    return {
      ...getPoolEventBase("REMOVE", this.txWithMeta, programId),
      idx: index.toString(),
      poolId: instruction.accounts[3].toString(),
      poolLpMint: instruction.accounts[3].toString(),
      poolCoinMint: coinMint,
      poolPcMint: pcMint,
      coinAmount:
        poolCoin?.info.tokenAmount.uiAmount ||
        convertToUiAmount(
          data.readBigUInt64LE(32),
          this.splDecimalsMap.get(coinMint),
        ), // amount1
      pcAmount:
        poolPc?.info.tokenAmount.uiAmount ||
        convertToUiAmount(
          data.readBigUInt64LE(24),
          this.splDecimalsMap.get(pcMint),
        ), // amount 0
      lpAmount: convertToUiAmount(data.readBigUInt64LE(8).toString()),
    };
  }
}

class RaydiumCPMMPoolParser {
  constructor(
    private readonly txWithMeta: ParsedTransactionWithMeta,
    private readonly splTokenMap: Map<string, TokenInfo>,
    private readonly splDecimalsMap: Map<string, number>,
  ) {}

  public getPoolAction(data: any): PoolEventType | null {
    const instructionType = data.slice(0, 8);

    if (instructionType.equals(DISCRIMINATORS.RAYDIUM_CPMM.CREATE)) {
      return "CREATE";
    } else if (
      instructionType.equals(DISCRIMINATORS.RAYDIUM_CPMM.ADD_LIQUIDITY)
    ) {
      return "ADD";
    } else if (
      instructionType.equals(DISCRIMINATORS.RAYDIUM_CPMM.REMOVE_LIQUIDITY)
    ) {
      return "REMOVE";
    }
    return null;
  }

  public parseRaydiumInstruction(
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
          return this.parseCreateEvent(instruction, index, data, transfers);
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
      console.error("parseRaydiumInstruction error:", error);
      return null;
    }
  }

  private parseCreateEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: any,
    transfers: TransferData[],
  ): PoolEvent {
    const [poolCoin, poolPc, lpCoin] = transfers;
    const coinMint = poolCoin?.info.mint || instruction.accounts[4].toString();
    const pcMint = poolPc?.info.mint || instruction.accounts[5].toString();
    const programId = instruction.programId.toBase58();
    return {
      ...getPoolEventBase("CREATE", this.txWithMeta, programId),
      idx: index.toString(),
      poolId: instruction.accounts[3].toString(),
      poolLpMint: instruction.accounts[6].toString(),
      poolCoinMint: coinMint,
      poolPcMint: pcMint,

      coinAmount:
        poolCoin?.info.tokenAmount.uiAmount ||
        convertToUiAmount(
          data.readBigUInt64LE(8),
          this.splDecimalsMap.get(coinMint),
        ),
      pcAmount:
        poolPc?.info.tokenAmount.uiAmount ||
        convertToUiAmount(
          data.readBigUInt64LE(16),
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
  ): PoolEvent | null {
    const [poolCoin, poolPc, lpCoin] = transfers;
    const coinMint = poolCoin?.info.mint || instruction.accounts[10].toString();
    const pcMint = poolPc?.info.mint || instruction.accounts[11].toString();
    const programId = instruction.programId.toBase58();
    if (transfers.length >= 2) {
      return {
        ...getPoolEventBase("ADD", this.txWithMeta, programId),
        idx: index.toString(),
        poolId: instruction.accounts[2].toString(),
        poolLpMint: instruction.accounts[12].toString(),
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
            data.readBigUInt64LE(24),
            this.splDecimalsMap.get(pcMint),
          ),
        lpAmount:
          lpCoin?.info.tokenAmount.uiAmount ||
          convertToUiAmount(data.readBigUInt64LE(8)),
      };
    }
    return null;
  }

  private parseRemoveLiquidityEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: any,
    transfers: TransferData[],
  ): PoolEvent {
    const [lpCoin, poolCoin, poolPc] = transfers;
    const coinMint = poolCoin?.info.mint || instruction.accounts[10].toString();
    const pcMint = poolPc?.info.mint || instruction.accounts[11].toString();
    const programId = instruction.programId.toBase58();
    return {
      ...getPoolEventBase("REMOVE", this.txWithMeta, programId),
      idx: index.toString(),
      poolId: instruction.accounts[2].toString(),
      poolLpMint: instruction.accounts[12].toString(),
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
          data.readBigUInt64LE(24),
          this.splDecimalsMap.get(pcMint),
        ),
      lpAmount:
        lpCoin?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(8).toString()),
    };
  }
}
