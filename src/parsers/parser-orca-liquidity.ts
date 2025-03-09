import { DEX_PROGRAMS, DISCRIMINATORS } from '../constants';
import { convertToUiAmount, PoolEvent, PoolEventType, TransferData } from '../types';
import { TransactionAdapter } from '../transaction-adapter';
import { TransactionUtils } from '../transaction-utils';
import { getInstructionData } from '../utils';

export class OrcaLiquidityParser {
  private readonly utils: TransactionUtils;
  constructor(private readonly adapter: TransactionAdapter) {
    this.utils = new TransactionUtils(adapter);
  }

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

  private getParser(programId: string): OrcaPoolParser | null {
    switch (programId) {
      case DEX_PROGRAMS.ORCA.id:
        return new OrcaPoolParser(this.adapter, this.utils);
      default:
        return null;
    }
  }
}

class OrcaPoolParser {
  constructor(
    private readonly adapter: TransactionAdapter,
    private readonly utils: TransactionUtils
  ) {}

  public getPoolAction(data: any): PoolEventType | null {
    const instructionType = data.slice(0, 8);
    if (
      instructionType.equals(DISCRIMINATORS.ORCA.ADD_LIQUIDITY) ||
      instructionType.equals(DISCRIMINATORS.ORCA.ADD_LIQUIDITY2)
    ) {
      return 'ADD';
    } else if (instructionType.equals(DISCRIMINATORS.ORCA.REMOVE_LIQUIDITY)) {
      return 'REMOVE';
    }
    return null;
  }

  public parseInstruction(
    instruction: any,
    index: number,
    innerIndex?: number
  ): PoolEvent | null {
    try {
      const data = getInstructionData(instruction);
      const action = this.getPoolAction(data);
      if (!action) return null;

      const transfers = this.parseTransfers(instruction, index, innerIndex);
      switch (action) {
        case 'ADD':
          return this.parseAddLiquidityEvent(instruction, index, data, transfers);
        case 'REMOVE':
          return this.parseRemoveLiquidityEvent(instruction, index, data, transfers);
      }
      return null;
    } catch (error) {
      console.error('parseInstruction error:', error);
      return null;
    }
  }

  protected getInstructionId(index: number, innerIndex?: number): string {
    return innerIndex === undefined ? index.toString() : `${index}-${innerIndex}`;
  }

  protected parseTransfers(
    instruction: any,
    index: number,
    innerIndex?: number
  ): TransferData[] {
    const curIdx = this.getInstructionId(index, innerIndex);
    const accounts = this.adapter.getInstructionAccounts(instruction);
    return this.utils
      .processTransferInstructions(index)
      .filter((transfer) => accounts.includes(transfer.info.destination) && transfer.idx >= curIdx);
  }

  private parseAddLiquidityEvent(
    instruction: any,
    index: number,
    data: any,
    transfers: TransferData[]
  ): PoolEvent {
    const [token0, token1] = this.utils.getLPTransfers(transfers);
    const token0Mint = token0?.info.mint;
    const token1Mint = token1?.info.mint;
    const programId = this.adapter.getInstructionProgramId(instruction);
    const accounts = this.adapter.getInstructionAccounts(instruction);
    return {
      ...this.adapter.getPoolEventBase('ADD', programId),
      idx: index.toString(),
      poolId: accounts[0],
      poolLpMint: accounts[0],
      token0Mint: token0Mint,
      token1Mint: token1Mint,
      token0Amount:
        token0?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(32), this.adapter.getTokenDecimals(token0Mint)),
      token1Amount:
        token1?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(24), this.adapter.getTokenDecimals(token1Mint)),
      lpAmount: convertToUiAmount(data.readBigUInt64LE(8), this.adapter.getTokenDecimals(accounts[1])) || 0,
    };
  }

  private parseRemoveLiquidityEvent(
    instruction: any,
    index: number,
    data: any,
    transfers: TransferData[]
  ): PoolEvent {
    const [token0, token1] = this.utils.getLPTransfers(transfers);
    const token0Mint = token0?.info.mint;
    const token1Mint = token1?.info.mint;
    const programId = this.adapter.getInstructionProgramId(instruction);
    const accounts = this.adapter.getInstructionAccounts(instruction);
    return {
      ...this.adapter.getPoolEventBase('REMOVE', programId),
      idx: index.toString(),
      poolId: accounts[0],
      poolLpMint: accounts[0],
      token0Mint: token0Mint,
      token1Mint: token1Mint,
      token0Amount:
        token0?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(32), this.adapter.getTokenDecimals(token0Mint)),
      token1Amount:
        token1?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(24), this.adapter.getTokenDecimals(token1Mint)),
      lpAmount: convertToUiAmount(data.readBigUInt64LE(8), this.adapter.getTokenDecimals(accounts[1])),
    };
  }
}
