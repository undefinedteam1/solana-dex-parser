import { ParsedTransactionWithMeta } from '@solana/web3.js';
import { DEX_PROGRAMS } from '../constants';
import { DexInfo, TokenInfo, TradeInfo, TransferData } from '../types';
import { getTransferTokenInfo, processSwapData } from '../transfer-utils';
import { getProgramName } from '../utils';

export class PumpfunParser {
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
    const [programId] = transfer[0].split(':');

    if (DEX_PROGRAMS.PUMP_FUN.id == programId) {
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
    return trades;
  }
}
