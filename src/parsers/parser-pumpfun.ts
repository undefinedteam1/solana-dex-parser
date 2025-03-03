import { ParsedTransactionWithMeta } from '@solana/web3.js';
import { DEX_PROGRAMS, TOKENS } from '../constants';
import { DexInfo, PumpfunEvent, PumpfunTradeEvent, TokenInfo, TradeInfo, TradeType, TransferData } from '../types';
import { PumpfunEventParser } from './parser-pumpfun-event';
import { attachTokenTransferInfo } from '../transfer-utils';

export class PumpfunParser {
  private eventParser: PumpfunEventParser;
  constructor(
    private readonly txWithMeta: ParsedTransactionWithMeta,
    private readonly dexInfo: DexInfo,
    private readonly splTokenMap: Map<string, TokenInfo>,
    private readonly splDecimalsMap: Map<string, number>,
    private readonly transferActions: Record<string, TransferData[]>
  ) {
    this.eventParser = new PumpfunEventParser(this.txWithMeta, dexInfo);
  }

  public processTrades(): TradeInfo[] {
    const events = this.eventParser.processEvents().filter((it) => it.type == 'TRADE');
    return events.length > 0 ? this.processSwapData(events) : [];
  }

  public parseTransferAction(transfer: [string, TransferData[]]): TradeInfo[] {
    const [, idxs] = transfer[0].split(':');
    const [outerIndex] = idxs.split('-');
    const events = this.parseInnerInstructions(Number(outerIndex));
    return events.length > 0 ? this.processSwapData(events) : [];
  }

  private parseInnerInstructions(instructionIndex: number): PumpfunEvent[] {
    return this.eventParser.parseInnerInstructions(instructionIndex).filter((it) => it.type == 'TRADE');
  }

  private processSwapData(events: PumpfunEvent[]): TradeInfo[] {
    if (!events.length) return [];
    return events.map((event) => this.createTradeInfo(event));
  }

  private createTradeInfo(data: PumpfunEvent): TradeInfo {
    const event = data.data as PumpfunTradeEvent;
    const tradeType: TradeType = event.isBuy ? 'BUY' : 'SELL';
    const isBuy = tradeType === 'BUY';

    const trade: TradeInfo = {
      type: tradeType,
      inputToken: {
        mint: isBuy ? TOKENS.SOL : event.mint,
        amount: isBuy ? event.solAmount : event.tokenAmount,
        decimals: isBuy ? 9 : 6,
      },
      outputToken: {
        mint: isBuy ? event.mint : TOKENS.SOL,
        amount: isBuy ? event.tokenAmount : event.solAmount,
        decimals: isBuy ? 6 : 9,
      },
      user: event.user,
      programId: this.dexInfo.programId || DEX_PROGRAMS.PUMP_FUN.id,
      amm: DEX_PROGRAMS.PUMP_FUN.name,
      route: this.dexInfo.route || '',
      slot: data.slot,
      timestamp: data.timestamp,
      signature: data.signature,
      idx: data.idx,
    };

    return attachTokenTransferInfo(trade, this.transferActions);
  }
}
