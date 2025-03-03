import { ParsedTransactionWithMeta, PartiallyDecodedInstruction } from '@solana/web3.js';
import { DEX_PROGRAMS, DISCRIMINATORS, TOKENS } from '../constants';
import { convertToUiAmount, PoolEvent, PoolEventType, TokenInfo, TransferData } from '../types';
import { TokenInfoExtractor } from '../token-extractor';
import { getLPTransfers, processTransferInnerInstruction } from '../transfer-utils';
import base58 from 'bs58';
import { getPoolEventBase } from '../utils';

export class RaydiumLiquidityParser {
  private readonly splTokenMap: Map<string, TokenInfo>;
  private readonly splDecimalsMap: Map<string, number>;

  constructor(private readonly txWithMeta: ParsedTransactionWithMeta) {
    const tokenExtractor = new TokenInfoExtractor(txWithMeta);
    this.splTokenMap = tokenExtractor.extractSPLTokenInfo();
    this.splDecimalsMap = tokenExtractor.extractDecimals();
  }

  // Process top-level instructions and fallback to inner instructions
  public processLiquidity(): PoolEvent[] {
    const events = this.txWithMeta.transaction.message.instructions
      .map((instr, idx) => this.processInstruction(instr, idx))
      .filter((event): event is PoolEvent => event !== null);

    return events.length > 0 ? events : this.processInnerInstructions();
  }

  private processInnerInstructions(): PoolEvent[] {
    try {
      return this.txWithMeta.transaction.message.instructions.flatMap((_, idx) => this.processInnerInstruction(idx));
    } catch (error) {
      console.error('Error processing Raydium inner instructions:', error);
      return [];
    }
  }

  private processInnerInstruction(outerIndex: number): PoolEvent[] {
    return (this.txWithMeta.meta?.innerInstructions || [])
      .filter((set) => set.index === outerIndex)
      .flatMap((set) =>
        set.instructions
          .map((instr, innerIdx) => this.processInstruction(instr, outerIndex, innerIdx))
          .filter((event): event is PoolEvent => event !== null)
      );
  }

  private processInstruction(instruction: any, outerIndex: number, innerIndex?: number): PoolEvent | null {
    const programId = instruction.programId.toBase58();
    const parsers = {
      [DEX_PROGRAMS.RAYDIUM_V4.id]: RaydiumV4PoolParser,
      [DEX_PROGRAMS.RAYDIUM_CL.id]: RaydiumCLPoolParser,
      [DEX_PROGRAMS.RAYDIUM_CPMM.id]: RaydiumCPMMPoolParser,
    };

    const ParserClass = parsers[programId];
    if (!ParserClass) return null;

    return new ParserClass(this.txWithMeta, this.splTokenMap, this.splDecimalsMap).parseRaydiumInstruction(
      instruction,
      outerIndex,
      innerIndex
    );
  }
}

class RaydiumV4PoolParser {
  constructor(
    private readonly txWithMeta: ParsedTransactionWithMeta,
    private readonly splTokenMap: Map<string, TokenInfo>,
    private readonly splDecimalsMap: Map<string, number>
  ) {}

  public getPoolAction(data: any): PoolEventType | null {
    const instructionType = data.slice(0, 1);
    if (instructionType.equals(DISCRIMINATORS.RAYDIUM.CREATE)) return 'CREATE';
    if (instructionType.equals(DISCRIMINATORS.RAYDIUM.ADD_LIQUIDITY)) return 'ADD';
    if (instructionType.equals(DISCRIMINATORS.RAYDIUM.REMOVE_LIQUIDITY)) return 'REMOVE';
    return null;
  }

  public parseRaydiumInstruction(
    instruction: PartiallyDecodedInstruction,
    index: number,
    innerIndex?: number
  ): PoolEvent | null {
    try {
      const data = base58.decode(instruction.data as string);
      const instructionType = this.getPoolAction(data);
      if (!instructionType) return null;

      const curIdx = innerIndex === undefined ? index.toString() : `${index}-${innerIndex}`;
      const accounts = instruction.accounts.map((it) => it.toBase58());
      const transfers = processTransferInnerInstruction(this.txWithMeta, index, this.splTokenMap, this.splDecimalsMap, [
        'mintTo',
        'burn',
      ]).filter((it) => it.info.mint != TOKENS.NATIVE && accounts.includes(it.info.destination) && it.idx >= curIdx);

      const handlers = {
        CREATE: () => this.parseCreateEvent(instruction, index, data, transfers),
        ADD: () => this.parseAddLiquidityEvent(instruction, index, data, transfers),
        REMOVE: () => this.parseRemoveLiquidityEvent(instruction, index, data, transfers),
      };

      return handlers[instructionType]();
    } catch (error) {
      console.error('parseRaydiumInstruction error:', error);
      return null;
    }
  }

  private parseCreateEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: any,
    transfers: TransferData[]
  ): PoolEvent {
    const [token0, token1] = getLPTransfers(transfers);
    const lpToken = transfers.find((it) => it.type === 'mintTo');
    const programId = instruction.programId.toBase58();

    return {
      ...getPoolEventBase('CREATE', this.txWithMeta, programId),
      idx: index.toString(),
      poolId: instruction.accounts[4].toString(),
      poolLpMint: lpToken?.info.mint || instruction.accounts[7].toString(),
      token0Mint: token0?.info.mint,
      token1Mint: token1?.info.mint,
      token0Amount: token0?.info.tokenAmount.uiAmount || 0,
      token1Amount: token1?.info.tokenAmount.uiAmount || 0,
      lpAmount: lpToken?.info.tokenAmount.uiAmount || 0,
    };
  }

  private parseAddLiquidityEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: any,
    transfers: TransferData[]
  ): PoolEvent {
    const [token0, token1] = getLPTransfers(transfers);
    const lpToken = transfers.find((it) => it.type === 'mintTo');
    const programId = instruction.programId.toBase58();

    return {
      ...getPoolEventBase('ADD', this.txWithMeta, programId),
      idx: index.toString(),
      poolId: instruction.accounts[1].toString(),
      poolLpMint: lpToken?.info.mint || instruction.accounts[5].toString(),
      token0Mint: token0?.info.mint,
      token1Mint: token1?.info.mint,
      token0Amount: token0?.info.tokenAmount.uiAmount || 0,
      token1Amount: token1?.info.tokenAmount.uiAmount || 0,
      lpAmount: lpToken?.info.tokenAmount.uiAmount || 0,
    };
  }

  private parseRemoveLiquidityEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: any,
    transfers: TransferData[]
  ): PoolEvent {
    const [token0, token1] = getLPTransfers(transfers);
    const lpToken = transfers.find((it) => it.type === 'burn');
    const programId = instruction.programId.toBase58();

    return {
      ...getPoolEventBase('REMOVE', this.txWithMeta, programId),
      idx: index.toString(),
      poolId: instruction.accounts[1].toString(),
      poolLpMint: lpToken?.info.mint || instruction.accounts[5].toString(),
      token0Mint: token0?.info.mint,
      token1Mint: token1?.info.mint,
      token0Amount: token0?.info.tokenAmount.uiAmount || 0,
      token1Amount: token1?.info.tokenAmount.uiAmount || 0,
      lpAmount: lpToken?.info.tokenAmount.uiAmount || 0,
    };
  }
}

class RaydiumCLPoolParser {
  constructor(
    private readonly txWithMeta: ParsedTransactionWithMeta,
    private readonly splTokenMap: Map<string, TokenInfo>,
    private readonly splDecimalsMap: Map<string, number>
  ) {}

  public getPoolAction(data: any): { name: string; type: PoolEventType } | null {
    const instructionType = data.slice(0, 8);

    // Check if it's a CREATE operation
    for (const [name, discriminator] of Object.entries(DISCRIMINATORS.RAYDIUM_CL.CREATE)) {
      if (instructionType.equals(discriminator)) {
        return { name, type: 'CREATE' };
      }
    }

    // Check if it's an ADD operation
    for (const [name, discriminator] of Object.entries(DISCRIMINATORS.RAYDIUM_CL.ADD_LIQUIDITY)) {
      if (instructionType.equals(discriminator)) {
        return { name, type: 'ADD' };
      }
    }

    // Check if it's a REMOVE operation
    for (const [name, discriminator] of Object.entries(DISCRIMINATORS.RAYDIUM_CL.REMOVE_LIQUIDITY)) {
      if (instructionType.equals(discriminator)) {
        return { name, type: 'REMOVE' };
      }
    }

    return null;
  }

  public parseRaydiumInstruction(
    instruction: PartiallyDecodedInstruction,
    index: number,
    innerIndex?: number
  ): PoolEvent | null {
    try {
      const data = base58.decode(instruction.data as string);
      const instructionType = this.getPoolAction(data);
      if (!instructionType) return null;

      const curIdx = innerIndex === undefined ? index.toString() : `${index}-${innerIndex}`;
      const accounts = instruction.accounts.map((it) => it.toBase58());
      const transfers = processTransferInnerInstruction(
        this.txWithMeta,
        index,
        this.splTokenMap,
        this.splDecimalsMap
      ).filter((it) => accounts.includes(it.info.destination) && it.idx >= curIdx);

      const handlers = {
        CREATE: () => {
          const poolAccountIdx = ['openPosition', 'openPositionV2'].includes(instructionType.name) ? 5 : 4;
          return this.parseCreateEvent(instruction, index, data, transfers, poolAccountIdx);
        },
        ADD: () => this.parseAddLiquidityEvent(instruction, index, data, transfers),
        REMOVE: () => this.parseRemoveLiquidityEvent(instruction, index, data, transfers),
      };

      return handlers[instructionType.type]();
    } catch (error) {
      console.error('parseRaydiumInstruction error:', error);
      return null;
    }
  }

  private parseCreateEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: any,
    transfers: TransferData[],
    poolAccountIdx: number
  ): PoolEvent {
    const [token0, token1] = getLPTransfers(transfers);
    const token0Mint = token0?.info.mint;
    const token1Mint = token1?.info.mint;
    const programId = instruction.programId.toBase58();

    return {
      ...getPoolEventBase('CREATE', this.txWithMeta, programId),
      idx: index.toString(),
      poolId: instruction.accounts[poolAccountIdx].toString(),
      poolLpMint: instruction.accounts[poolAccountIdx].toString(),
      token0Mint,
      token1Mint,
      token0Amount: token0?.info.tokenAmount.uiAmount || 0,
      token1Amount: token1?.info.tokenAmount.uiAmount || 0,
      lpAmount: 0,
    };
  }

  private parseAddLiquidityEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: any,
    transfers: TransferData[]
  ): PoolEvent | null {
    if (transfers.length < 2) return null;

    const [token0, token1] = getLPTransfers(transfers);
    const token0Mint = token0?.info.mint || instruction.accounts[13].toString();
    const token1Mint = token1?.info.mint || instruction.accounts[14].toString();
    const programId = instruction.programId.toBase58();

    return {
      ...getPoolEventBase('ADD', this.txWithMeta, programId),
      idx: index.toString(),
      poolId: instruction.accounts[2].toString(),
      poolLpMint: instruction.accounts[2].toString(),
      token0Mint,
      token1Mint,
      token0Amount:
        token0?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(32), this.splDecimalsMap.get(token0Mint)),
      token1Amount:
        token1?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(24), this.splDecimalsMap.get(token1Mint)),
      lpAmount: convertToUiAmount(data.readBigUInt64LE(8)) || 0,
    };
  }

  private parseRemoveLiquidityEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: any,
    transfers: TransferData[]
  ): PoolEvent {
    const [token0, token1] = getLPTransfers(transfers);
    const token0Mint = token0?.info.mint;
    const token1Mint = token1?.info.mint;
    const programId = instruction.programId.toBase58();

    return {
      ...getPoolEventBase('REMOVE', this.txWithMeta, programId),
      idx: index.toString(),
      poolId: instruction.accounts[3].toString(),
      poolLpMint: instruction.accounts[3].toString(),
      token0Mint,
      token1Mint,
      token0Amount:
        token0?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(32), this.splDecimalsMap.get(token0Mint)),
      token1Amount:
        token1?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(24), this.splDecimalsMap.get(token1Mint)),
      lpAmount: convertToUiAmount(data.readBigUInt64LE(8).toString()),
    };
  }
}

class RaydiumCPMMPoolParser {
  constructor(
    private readonly txWithMeta: ParsedTransactionWithMeta,
    private readonly splTokenMap: Map<string, TokenInfo>,
    private readonly splDecimalsMap: Map<string, number>
  ) {}

  public getPoolAction(data: any): PoolEventType | null {
    const instructionType = data.slice(0, 8);
    if (instructionType.equals(DISCRIMINATORS.RAYDIUM_CPMM.CREATE)) return 'CREATE';
    if (instructionType.equals(DISCRIMINATORS.RAYDIUM_CPMM.ADD_LIQUIDITY)) return 'ADD';
    if (instructionType.equals(DISCRIMINATORS.RAYDIUM_CPMM.REMOVE_LIQUIDITY)) return 'REMOVE';
    return null;
  }

  public parseRaydiumInstruction(
    instruction: PartiallyDecodedInstruction,
    index: number,
    innerIndex?: number
  ): PoolEvent | null {
    try {
      const data = base58.decode(instruction.data as string);
      const instructionType = this.getPoolAction(data);
      if (!instructionType) return null;

      const curIdx = innerIndex === undefined ? index.toString() : `${index}-${innerIndex}`;
      const accounts = instruction.accounts.map((it) => it.toBase58());
      const transfers = processTransferInnerInstruction(this.txWithMeta, index, this.splTokenMap, this.splDecimalsMap, [
        'mintTo',
        'burn',
      ]).filter((it) => accounts.includes(it.info.destination) && it.idx >= curIdx);

      const handlers = {
        CREATE: () => this.parseCreateEvent(instruction, index, data, transfers),
        ADD: () => this.parseAddLiquidityEvent(instruction, index, data, transfers),
        REMOVE: () => this.parseRemoveLiquidityEvent(instruction, index, data, transfers),
      };

      return handlers[instructionType]();
    } catch (error) {
      console.error('parseRaydiumInstruction error:', error);
      return null;
    }
  }

  private parseCreateEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: any,
    transfers: TransferData[]
  ): PoolEvent {
    const [token0, token1] = getLPTransfers(transfers);
    const lpToken = transfers.find((it) => it.type === 'mintTo');
    const programId = instruction.programId.toBase58();

    return {
      ...getPoolEventBase('CREATE', this.txWithMeta, programId),
      idx: index.toString(),
      poolId: instruction.accounts[3].toString(),
      poolLpMint: lpToken?.info.mint || instruction.accounts[6].toString(),
      token0Mint: token0?.info.mint,
      token1Mint: token1?.info.mint,
      token0Amount:
        token0?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(8), this.splDecimalsMap.get(token0?.info.mint)),
      token1Amount:
        token1?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(16), this.splDecimalsMap.get(token1?.info.mint)),
      lpAmount: lpToken?.info.tokenAmount.uiAmount || 0,
    };
  }

  private parseAddLiquidityEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: any,
    transfers: TransferData[]
  ): PoolEvent | null {
    if (transfers.length < 2) return null;

    const [token0, token1] = getLPTransfers(transfers);
    const lpToken = transfers.find((it) => it.type === 'mintTo');
    const programId = instruction.programId.toBase58();

    return {
      ...getPoolEventBase('ADD', this.txWithMeta, programId),
      idx: index.toString(),
      poolId: instruction.accounts[2].toString(),
      poolLpMint: instruction.accounts[12].toString(),
      token0Mint: token0?.info.mint,
      token1Mint: token1?.info.mint,
      token0Amount:
        token0?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(16), this.splDecimalsMap.get(token0?.info.mint)),
      token1Amount:
        token1?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(24), this.splDecimalsMap.get(token1?.info.mint)),
      lpAmount: lpToken?.info.tokenAmount.uiAmount || convertToUiAmount(data.readBigUInt64LE(8)),
    };
  }

  private parseRemoveLiquidityEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: any,
    transfers: TransferData[]
  ): PoolEvent {
    const [token0, token1] = getLPTransfers(transfers);
    const lpToken = transfers.find((it) => it.type === 'burn');
    const programId = instruction.programId.toBase58();

    return {
      ...getPoolEventBase('REMOVE', this.txWithMeta, programId),
      idx: index.toString(),
      poolId: instruction.accounts[2].toString(),
      poolLpMint: instruction.accounts[12].toString(),
      token0Mint: token0?.info.mint,
      token1Mint: token1?.info.mint,
      token0Amount:
        token0?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(16), this.splDecimalsMap.get(token0?.info.mint)),
      token1Amount:
        token1?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(24), this.splDecimalsMap.get(token1?.info.mint)),
      lpAmount: lpToken?.info.tokenAmount.uiAmount || convertToUiAmount(data.readBigUInt64LE(8).toString()),
    };
  }
}
