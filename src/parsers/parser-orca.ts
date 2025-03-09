import { DEX_PROGRAMS, DISCRIMINATORS } from '../constants';
import { DexInfo, TradeInfo, TransferData } from '../types';
import { getInstructionData, getProgramName } from '../utils';
import { TransactionAdapter } from '../transaction-adapter';
import { TransactionUtils } from '../transaction-utils';

export class OrcaParser {
  private readonly utils: TransactionUtils;

  constructor(
    private readonly adapter: TransactionAdapter,
    private readonly dexInfo: DexInfo,
    private readonly transferActions: Record<string, TransferData[]>
  ) {
    this.utils = new TransactionUtils(adapter);
  }

  public processTrades(): TradeInfo[] {
    const trades: TradeInfo[] = [];
    Object.entries(this.transferActions).forEach((it) => {
      trades.push(...this.parseTransferAction(it));
    });
    return trades;
  }

  public parseTransferAction(transfer: [string, TransferData[]]): TradeInfo[] {
    const trades: TradeInfo[] = [];
    const [programId, idxs] = transfer[0].split(':');
    const [outerIndex, innerIndex] = idxs.split('-');

    if (transfer[1].length >= 2 && DEX_PROGRAMS.ORCA.id == programId) {
      const instruction = innerIndex
        ? this.adapter.getInnerInstruction(Number(outerIndex), Number(innerIndex))
        : this.adapter.instructions[Number(outerIndex)];
      if (this.notLiquidityEvent(instruction)) {
        const trade = this.utils.processSwapData(transfer[1], {
          ...this.dexInfo,
          amm: this.dexInfo.amm || getProgramName(programId),
        });
        if (trade) {
          trades.push(trade);
        }
      }
    }
    return trades;
  }

  private notLiquidityEvent(instruction: any): boolean {
    if (instruction.data) {
      const instructionType = getInstructionData(instruction).slice(0, 8);
      return !Object.values(DISCRIMINATORS.ORCA).some((it) => instructionType.equals(it));
    }
    return true;
  }
}
