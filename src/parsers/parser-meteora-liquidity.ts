import { ParsedTransactionWithMeta, PartiallyDecodedInstruction } from '@solana/web3.js';
import { DEX_PROGRAMS, DISCRIMINATORS, TOKENS } from '../constants';
import { PoolEvent, PoolEventType, TokenInfo, TransferData, convertToUiAmount } from '../types';
import { TokenInfoExtractor } from '../token-extractor';
import { getLPTransfers, processTransferInnerInstruction } from '../transfer-utils';
import base58 from 'bs58';
import { getPoolEventBase } from '../utils';

// Base parser class with shared utilities
abstract class BaseMeteoraParser {
  constructor(
    protected readonly txWithMeta: ParsedTransactionWithMeta,
    protected readonly splTokenMap: Map<string, TokenInfo>,
    protected readonly splDecimalsMap: Map<string, number>
  ) {}

  protected getInstructionId(index: number, innerIndex?: number): string {
    return innerIndex === undefined ? index.toString() : `${index}-${innerIndex}`;
  }

  protected parseTransfers(
    instruction: PartiallyDecodedInstruction,
    index: number,
    innerIndex?: number
  ): TransferData[] {
    const curIdx = this.getInstructionId(index, innerIndex);
    const accounts = instruction.accounts.map((acc) => acc.toBase58());
    return processTransferInnerInstruction(this.txWithMeta, index, this.splTokenMap, this.splDecimalsMap).filter(
      (transfer) => accounts.includes(transfer.info.destination) && transfer.idx >= curIdx
    );
  }

  abstract getPoolAction(data: Buffer): any | PoolEventType | null;
  abstract parseInstruction(
    instruction: PartiallyDecodedInstruction,
    index: number,
    innerIndex?: number
  ): PoolEvent | null;
}

// Main parser for Meteora liquidity events
export class MeteoraLiquidityParser {
  private readonly tokenExtractor: TokenInfoExtractor;
  private readonly splTokenMap: Map<string, TokenInfo>;
  private readonly splDecimalsMap: Map<string, number>;

  constructor(private readonly txWithMeta: ParsedTransactionWithMeta) {
    this.tokenExtractor = new TokenInfoExtractor(txWithMeta);
    this.splTokenMap = this.tokenExtractor.extractSPLTokenInfo();
    this.splDecimalsMap = this.tokenExtractor.extractDecimals();
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
      console.error('Error processing Meteora inner instructions:', error);
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

  private processInstruction(instruction: any, index: number, innerIndex?: number): PoolEvent | null {
    const programId = instruction.programId.toBase58();
    const parser = this.getParser(programId);
    return parser ? parser.parseInstruction(instruction, index, innerIndex) : null;
  }

  private getParser(programId: string): BaseMeteoraParser | null {
    switch (programId) {
      case DEX_PROGRAMS.METEORA.id:
        return new MeteoraDLMMPoolParser(this.txWithMeta, this.splTokenMap, this.splDecimalsMap);
      case DEX_PROGRAMS.METEORA_POOLS.id:
        return new MeteoraPoolsPoolParser(this.txWithMeta, this.splTokenMap, this.splDecimalsMap);
      default:
        return null;
    }
  }
}

// Parser for Meteora DLMM pools
class MeteoraDLMMPoolParser extends BaseMeteoraParser {
  public getPoolAction(data: any): { name: string; type: PoolEventType } | null {
    const instructionType = data.slice(0, 8);

    // Check if it's an ADD operation
    for (const [name, discriminator] of Object.entries(DISCRIMINATORS.METEORA_DLMM.ADD_LIQUIDITY)) {
      if (instructionType.equals(discriminator)) {
        return { name, type: 'ADD' };
      }
    }

    // Check if it's a REMOVE operation
    for (const [name, discriminator] of Object.entries(DISCRIMINATORS.METEORA_DLMM.REMOVE_LIQUIDITY)) {
      if (instructionType.equals(discriminator)) {
        return { name, type: 'REMOVE' };
      }
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
      const action = this.getPoolAction(data);
      if (!action) return null;

      const transfers = this.parseTransfers(instruction, index, innerIndex);
      return action.type === 'ADD'
        ? this.parseAddLiquidityEvent(instruction, index, transfers)
        : this.parseRemoveLiquidityEvent(instruction, index, transfers);
    } catch (error) {
      console.error('Error parsing DLMM instruction:', error);
      return null;
    }
  }

  // Parse ADD liquidity event
  private parseAddLiquidityEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    transfers: TransferData[]
  ): PoolEvent {
    const [token0, token1] = this.normalizeTokens(transfers);
    const programId = instruction.programId.toBase58();
    return {
      ...getPoolEventBase('ADD', this.txWithMeta, programId),
      idx: this.getInstructionId(index),
      poolId: instruction.accounts[1].toString(),
      poolLpMint: instruction.accounts[1].toString(),
      token0Mint: token0?.info.mint,
      token1Mint: token1?.info.mint,
      token0Amount: token0?.info.tokenAmount.uiAmount || 0,
      token1Amount: token1?.info.tokenAmount.uiAmount || 0,
    };
  }

  // Parse REMOVE liquidity event
  private parseRemoveLiquidityEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    transfers: TransferData[]
  ): PoolEvent {
    let [token0, token1] = this.normalizeTokens(transfers);
    if (token1 == undefined && token0?.info.mint == instruction.accounts[8].toString()) {
      token1 = token0;
      token0 = undefined;
    } else if (token0 == undefined && token1?.info.mint == instruction.accounts[7].toString()) {
      token0 = token1;
      token1 = undefined;
    }

    const programId = instruction.programId.toBase58();
    return {
      ...getPoolEventBase('REMOVE', this.txWithMeta, programId),
      idx: this.getInstructionId(index),
      poolId: instruction.accounts[1].toString(),
      poolLpMint: instruction.accounts[1].toString(),
      token0Mint: token0?.info.mint || instruction.accounts[7].toString(),
      token1Mint: token1?.info.mint || instruction.accounts[8].toString(),
      token0Amount: token0?.info.tokenAmount.uiAmount || 0,
      token1Amount: token1?.info.tokenAmount.uiAmount || 0,
    };
  }

  private normalizeTokens(transfers: TransferData[]): [TransferData | undefined, TransferData | undefined] {
    let [token0, token1]: any[] = getLPTransfers(transfers);
    if (transfers.length === 1 && transfers[0].info.mint == TOKENS.SOL) {
      token1 = transfers[0];
      token0 = undefined;
    }
    return [token0, token1];
  }
}

// Parser for Meteora Pools
class MeteoraPoolsPoolParser extends BaseMeteoraParser {
  public getPoolAction(data: Buffer): PoolEventType | null {
    const instructionType = data.slice(0, 8);
    if (instructionType.equals(DISCRIMINATORS.METEORA_POOLS.CREATE)) return 'CREATE';
    if (instructionType.equals(DISCRIMINATORS.METEORA_POOLS.ADD_LIQUIDITY)) return 'ADD';
    if (instructionType.equals(DISCRIMINATORS.METEORA_POOLS.REMOVE_LIQUIDITY)) return 'REMOVE';
    return null;
  }

  public parseInstruction(
    instruction: PartiallyDecodedInstruction,
    index: number,
    innerIndex?: number
  ): PoolEvent | null {
    try {
      const data = base58.decode(instruction.data as string);
      const action = this.getPoolAction(data);
      if (!action) return null;

      const transfers = this.parseTransfers(instruction, index, innerIndex);
      switch (action) {
        case 'CREATE':
          return this.parseCreateLiquidityEvent(instruction, index, data, transfers);
        case 'ADD':
          return this.parseAddLiquidityEvent(instruction, index, data, transfers);
        case 'REMOVE':
          return this.parseRemoveLiquidityEvent(instruction, index, data, transfers);
        default:
          return null;
      }
    } catch (error) {
      console.error('Error parsing Pools instruction:', error);
      return null;
    }
  }

  // Parse CREATE liquidity event
  private parseCreateLiquidityEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: Buffer,
    transfers: TransferData[]
  ): PoolEvent {
    const [token0, token1] = getLPTransfers(transfers);
    const lpToken = transfers.find((t) => t.type === 'mintTo');
    const token0Mint = token0?.info.mint || instruction.accounts[3].toString();
    const token1Mint = token1?.info.mint || instruction.accounts[4].toString();
    const programId = instruction.programId.toBase58();
    return {
      ...getPoolEventBase('CREATE', this.txWithMeta, programId),
      idx: this.getInstructionId(index),
      poolId: instruction.accounts[0].toString(),
      poolLpMint: instruction.accounts[2].toString(),
      token0Mint,
      token1Mint,
      token0Amount:
        token0?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(16), this.splDecimalsMap.get(token0Mint)),
      token1Amount:
        token1?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(8), this.splDecimalsMap.get(token1Mint)),
      lpAmount: lpToken?.info.tokenAmount.uiAmount || 0,
    };
  }

  // Parse ADD liquidity event
  private parseAddLiquidityEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: Buffer,
    transfers: TransferData[]
  ): PoolEvent {
    const [token0, token1] = getLPTransfers(transfers);
    const lpToken = transfers.find((t) => t.type === 'mintTo');
    const token0Mint = token0?.info.mint;
    const token1Mint = token1?.info.mint;
    const programId = instruction.programId.toBase58();
    return {
      ...getPoolEventBase('ADD', this.txWithMeta, programId),
      idx: this.getInstructionId(index),
      poolId: instruction.accounts[0].toString(),
      poolLpMint: instruction.accounts[1].toString(),
      token0Mint,
      token1Mint,
      token0Amount:
        token0?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(24), this.splDecimalsMap.get(token0Mint)),
      token1Amount:
        token1?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(16), this.splDecimalsMap.get(token1Mint)),
      lpAmount:
        lpToken?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(8), this.splDecimalsMap.get(instruction.accounts[1].toString())),
    };
  }

  // Parse REMOVE liquidity event
  private parseRemoveLiquidityEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: Buffer,
    transfers: TransferData[]
  ): PoolEvent {
    const [token0, token1] = getLPTransfers(transfers);
    const lpToken = transfers.find((t) => t.type === 'burn');
    const token0Mint = token0?.info.mint;
    const token1Mint = token1?.info.mint;
    const programId = instruction.programId.toBase58();
    return {
      ...getPoolEventBase('REMOVE', this.txWithMeta, programId),
      idx: this.getInstructionId(index),
      poolId: instruction.accounts[0].toString(),
      poolLpMint: instruction.accounts[1].toString(),
      token0Mint,
      token1Mint,
      token0Amount:
        token0?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(24), this.splDecimalsMap.get(token0Mint)),
      token1Amount:
        token1?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(16), this.splDecimalsMap.get(token1Mint)),
      lpAmount:
        lpToken?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(8), this.splDecimalsMap.get(instruction.accounts[1].toString())),
    };
  }
}
