import { DEX_PROGRAMS, DISCRIMINATORS } from '../constants';
import { DexInfo, TradeInfo, TransferData } from '../types';
import { getInstructionData, getProgramName } from '../utils';
import { TransactionAdapter } from '../transaction-adapter';
import { TransactionUtils } from '../transaction-utils';

export class RaydiumParser {
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

    if (
      transfer[1].length >= 2 &&
      [
        DEX_PROGRAMS.RAYDIUM_V4.id,
        DEX_PROGRAMS.RAYDIUM_ROUTE.id,
        DEX_PROGRAMS.RAYDIUM_CL.id,
        DEX_PROGRAMS.RAYDIUM_CPMM.id,
      ].includes(programId)
    ) {
      const instruction = innerIndex
        ? this.adapter.getInnerInstruction(Number(outerIndex), Number(innerIndex))
        : this.adapter.instructions[Number(outerIndex)];
      if (this.notLiquidityEvent(instruction)) {
        const trade = this.utils.processSwapData(transfer[1].slice(0, 2), {
          ...this.dexInfo,
          amm: this.dexInfo.amm || getProgramName(programId),
        });
        if (trade) {
          if (transfer[1].length > 2) {
            trade.fee = this.utils.getTransferTokenInfo(transfer[1][2]) ?? undefined;
          }
          trades.push(trade);
        }
      }
    }
    return trades;
  }

  private notLiquidityEvent(instruction: any): boolean {
    if (instruction.data) {
      const data = getInstructionData(instruction);
      const a = Object.values(DISCRIMINATORS.RAYDIUM).some((it) => data.slice(0, 1).equals(it));
      const b = Object.values(DISCRIMINATORS.RAYDIUM_CL)
        .flatMap((it) => Object.values(it))
        .some((it) => data.slice(0, 8).equals(it));
      const c = Object.values(DISCRIMINATORS.RAYDIUM_CPMM).some((it) => data.slice(0, 8).equals(it));
      return !a && !b && !c;
    }
    return true;
  }
}
