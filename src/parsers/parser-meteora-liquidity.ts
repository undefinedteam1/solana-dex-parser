import { DEX_PROGRAMS, DISCRIMINATORS, TOKENS } from '../constants';
import { TransactionAdapter } from '../transaction-adapter';
import { TransactionUtils } from '../transaction-utils';
import { PoolEvent, PoolEventType, TransferData, convertToUiAmount } from '../types';
import { getInstructionData } from '../utils';

// Base parser class with shared utilities
abstract class BaseMeteoraParser {
  protected readonly utils: TransactionUtils;
  constructor(protected readonly adapter: TransactionAdapter) {
    this.utils = new TransactionUtils(adapter);
  }

  protected getInstructionId(index: number, innerIndex?: number): string {
    return innerIndex === undefined ? index.toString() : `${index}-${innerIndex}`;
  }

  protected parseTransfers(instruction: any, index: number, innerIndex?: number): TransferData[] {
    const curIdx = this.getInstructionId(index, innerIndex);
    const accounts = this.adapter.getInstructionAccounts(instruction);
    return this.utils
      .processTransferInstructions(index)
      .filter((transfer) => accounts.includes(transfer.info.destination) && transfer.idx >= curIdx);
  }

  abstract getPoolAction(data: Buffer): any | PoolEventType | null;
  abstract parseInstruction(instruction: any, index: number, innerIndex?: number): PoolEvent | null;
}

// Main parser for Meteora liquidity events
export class MeteoraLiquidityParser {
  private readonly utils: TransactionUtils;
  constructor(private readonly adapter: TransactionAdapter) {
    this.utils = new TransactionUtils(adapter);
  }

  // Process top-level instructions and fallback to inner instructions
  public processLiquidity(): PoolEvent[] {
    const events = this.adapter.instructions
      .map((instr: any, idx: number) => this.processInstruction(instr, idx))
      .filter((event: any): event is PoolEvent => event !== null);

    return events.length > 0 ? events : this.processInnerInstructions();
  }

  private processInnerInstructions(): PoolEvent[] {
    try {
      return this.adapter.instructions.flatMap((_: any, idx: number) => this.processInnerInstruction(idx));
    } catch (error) {
      console.error('Error processing Meteora inner instructions:', error);
      return [];
    }
  }

  private processInnerInstruction(outerIndex: number): PoolEvent[] {
    return (this.adapter.innerInstructions || [])
      .filter((set) => set.index === outerIndex)
      .flatMap((set) =>
        set.instructions
          .map((instr, innerIdx) => this.processInstruction(instr, outerIndex, innerIdx))
          .filter((event): event is PoolEvent => event !== null)
      );
  }

  private processInstruction(instruction: any, index: number, innerIndex?: number): PoolEvent | null {
    const programId = this.adapter.getInstructionProgramId(instruction);
    const parser = this.getParser(programId);
    return parser ? parser.parseInstruction(instruction, index, innerIndex) : null;
  }

  private getParser(programId: string): BaseMeteoraParser | null {
    switch (programId) {
      case DEX_PROGRAMS.METEORA.id:
        return new MeteoraDLMMPoolParser(this.adapter);
      case DEX_PROGRAMS.METEORA_POOLS.id:
        return new MeteoraPoolsPoolParser(this.adapter);
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

  public parseInstruction(instruction: any, index: number, innerIndex?: number): PoolEvent | null {
    try {
      const data = getInstructionData(instruction);
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
  private parseAddLiquidityEvent(instruction: any, index: number, transfers: TransferData[]): PoolEvent {
    const [token0, token1] = this.normalizeTokens(transfers);
    const programId = this.adapter.getInstructionProgramId(instruction);
    const accounts = this.adapter.getInstructionAccounts(instruction);
    return {
      ...this.adapter.getPoolEventBase('ADD', programId),
      idx: this.getInstructionId(index),
      poolId: accounts[1],
      poolLpMint: accounts[1],
      token0Mint: token0?.info.mint,
      token1Mint: token1?.info.mint,
      token0Amount: token0?.info.tokenAmount.uiAmount || 0,
      token1Amount: token1?.info.tokenAmount.uiAmount || 0,
      token0Decimals: this.adapter.getTokenDecimals(token0!.info.mint),
      token1Decimals: this.adapter.getTokenDecimals(token1!.info.mint),
    };
  }

  // Parse REMOVE liquidity event
  private parseRemoveLiquidityEvent(instruction: any, index: number, transfers: TransferData[]): PoolEvent {
    const accounts = this.adapter.getInstructionAccounts(instruction);
    let [token0, token1] = this.normalizeTokens(transfers);
    if (token1 == undefined && token0?.info.mint == accounts[8]) {
      token1 = token0;
      token0 = undefined;
    } else if (token0 == undefined && token1?.info.mint == accounts[7]) {
      token0 = token1;
      token1 = undefined;
    }

    const programId = this.adapter.getInstructionProgramId(instruction);
    return {
      ...this.adapter.getPoolEventBase('REMOVE', programId),
      idx: this.getInstructionId(index),
      poolId: accounts[1],
      poolLpMint: accounts[1],
      token0Mint: token0?.info.mint || accounts[7],
      token1Mint: token1?.info.mint || accounts[8],
      token0Amount: token0?.info.tokenAmount.uiAmount || 0,
      token1Amount: token1?.info.tokenAmount.uiAmount || 0,
      token0Decimals: this.adapter.getTokenDecimals(token0!.info.mint || accounts[7]),
      token1Decimals: this.adapter.getTokenDecimals(token1!.info.mint || accounts[8]),
    };
  }

  private normalizeTokens(transfers: TransferData[]): [TransferData | undefined, TransferData | undefined] {
    let [token0, token1]: any[] = this.utils.getLPTransfers(transfers);
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

  public parseInstruction(instruction: any, index: number, innerIndex?: number): PoolEvent | null {
    try {
      const data = getInstructionData(instruction);
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
    instruction: any,
    index: number,
    data: Buffer,
    transfers: TransferData[]
  ): PoolEvent {
    const accounts = this.adapter.getInstructionAccounts(instruction);
    const [token0, token1] = this.utils.getLPTransfers(transfers);
    const lpToken = transfers.find((t) => t.type === 'mintTo');
    const token0Mint = token0?.info.mint || accounts[3];
    const token1Mint = token1?.info.mint || accounts[4];
    const programId = this.adapter.getInstructionProgramId(instruction);
    const [token0Decimals, token1Decimals] = [this.adapter.getTokenDecimals(token0Mint), this.adapter.getTokenDecimals(token1Mint)];
    return {
      ...this.adapter.getPoolEventBase('CREATE', programId),
      idx: this.getInstructionId(index),
      poolId: accounts[0],
      poolLpMint: accounts[2],
      token0Mint,
      token1Mint,
      token0Amount:
        token0?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(16), token0Decimals),
      token1Amount:
        token1?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(8), token1Decimals),
      token0Decimals: token0Decimals,
      token1Decimals: token1Decimals,
      lpAmount: lpToken?.info.tokenAmount.uiAmount || 0,
    };
  }

  // Parse ADD liquidity event
  private parseAddLiquidityEvent(instruction: any, index: number, data: Buffer, transfers: TransferData[]): PoolEvent {
    const accounts = this.adapter.getInstructionAccounts(instruction);
    const [token0, token1] = this.utils.getLPTransfers(transfers);
    const lpToken = transfers.find((t) => t.type === 'mintTo');
    const token0Mint = token0?.info.mint;
    const token1Mint = token1?.info.mint;
    const programId = this.adapter.getInstructionProgramId(instruction);
    const [token0Decimals, token1Decimals] = [this.adapter.getTokenDecimals(token0Mint), this.adapter.getTokenDecimals(token1Mint)];

    return {
      ...this.adapter.getPoolEventBase('ADD', programId),
      idx: this.getInstructionId(index),
      poolId: accounts[0],
      poolLpMint: accounts[1],
      token0Mint,
      token1Mint,
      token0Amount:
        token0?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(24), this.adapter.getTokenDecimals(token0Mint)),
      token1Amount:
        token1?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(16), this.adapter.getTokenDecimals(token1Mint)),
      token0Decimals: token0Decimals,
      token1Decimals: token1Decimals,
      lpAmount:
        lpToken?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(8), this.adapter.getTokenDecimals(accounts[1])),

    };
  }

  // Parse REMOVE liquidity event
  private parseRemoveLiquidityEvent(
    instruction: any,
    index: number,
    data: Buffer,
    transfers: TransferData[]
  ): PoolEvent {
    const [token0, token1] = this.utils.getLPTransfers(transfers);
    const lpToken = transfers.find((t) => t.type === 'burn');
    const token0Mint = token0?.info.mint;
    const token1Mint = token1?.info.mint;
    const programId = this.adapter.getInstructionProgramId(instruction);
    const accounts = this.adapter.getInstructionAccounts(instruction);
    const [token0Decimals, token1Decimals] = [this.adapter.getTokenDecimals(token0Mint), this.adapter.getTokenDecimals(token1Mint)];

    return {
      ...this.adapter.getPoolEventBase('REMOVE', programId),
      idx: this.getInstructionId(index),
      poolId: accounts[0],
      poolLpMint: accounts[1],
      token0Mint,
      token1Mint,
      token0Amount:
        token0?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(24), this.adapter.getTokenDecimals(token0Mint)),
      token1Amount:
        token1?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(16), this.adapter.getTokenDecimals(token1Mint)),
      token0Decimals: token0Decimals,
      token1Decimals: token1Decimals,
      lpAmount:
        lpToken?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(8), this.adapter.getTokenDecimals(accounts[1])),
    };
  }
}
