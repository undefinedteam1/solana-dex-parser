import { ParsedTransactionWithMeta } from '@solana/web3.js';
import { DEX_PROGRAMS, DISCRIMINATORS } from '../constants';
import { DexInfo, TokenInfo, TradeInfo, TransferData } from '../types';
import { getTransferTokenInfo, processSwapData } from '../transfer-utils';
import base58 from 'bs58';
import { getProgramName } from '../utils';

export class RaydiumParser {
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
      if (it[1].length >= 2) {
        trades.push(...this.parseTransferAction(it));
      }
    });
    return trades;
  }

  public parseTransferAction(transfer: [string, TransferData[]]): TradeInfo[] {
    const trades: TradeInfo[] = [];
    const [programId, idxs] = transfer[0].split(':');
    const [outerIndex, innerIndex] = idxs.split('-');

    if (
      [
        DEX_PROGRAMS.RAYDIUM_V4.id,
        DEX_PROGRAMS.RAYDIUM_ROUTE.id,
        DEX_PROGRAMS.RAYDIUM_CL.id,
        DEX_PROGRAMS.RAYDIUM_CPMM.id,
      ].includes(programId)
    ) {
      const instruction = innerIndex
        ? this.txWithMeta.meta?.innerInstructions?.find((it) => it.index == Number(outerIndex))?.instructions[
            Number(innerIndex)
          ]
        : this.txWithMeta.transaction.message.instructions[Number(outerIndex)];
      if (this.notLiquidityEvent(instruction)) {
        const trade = processSwapData(this.txWithMeta, transfer[1].slice(0, 2), {
          ...this.dexInfo,
          amm: this.dexInfo.amm || getProgramName(programId),
        });
        if (trade) {
          if (transfer[1].length > 2) {
            trade.fee = getTransferTokenInfo(transfer[1][2]) ?? undefined;
          }
          trades.push(trade);
        }
      }
    }
    return trades;
  }

  private notLiquidityEvent(instruction: any): boolean {
    if (instruction.data) {
      const data = base58.decode(instruction.data as string);
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
