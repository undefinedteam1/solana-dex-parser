import { ParsedTransactionWithMeta } from '@solana/web3.js';
import { DEX_PROGRAMS, DISCRIMINATORS } from '../constants';
import { DexInfo, TokenInfo, TradeInfo, TransferData } from '../types';
import { processSwapData } from '../transfer-utils';
import base58 from 'bs58';
import { getProgramName } from '../utils';

export class OrcaParser {
  constructor(
    private readonly txWithMeta: ParsedTransactionWithMeta,
    private readonly dexInfo: DexInfo,
    private readonly splTokenMap: Map<string, TokenInfo>,
    private readonly splDecimalsMap: Map<string, number>,
    private readonly transferActions: Record<string, TransferData[]>
  ) {}

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
        ? this.txWithMeta.meta?.innerInstructions?.find((it) => it.index == Number(outerIndex))?.instructions[
            Number(innerIndex)
          ]
        : this.txWithMeta.transaction.message.instructions[Number(outerIndex)];
      if (this.notLiquidityEvent(instruction)) {
        const trade = processSwapData(this.txWithMeta, transfer[1], {
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
      const instructionType = base58.decode(instruction.data as string).slice(0, 8);
      return !Object.values(DISCRIMINATORS.ORCA).some((it) => instructionType.equals(it));
    }
    return true;
  }
}
