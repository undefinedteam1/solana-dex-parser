import { TransactionAdapter } from '../../transaction-adapter';
import { BoopfunEvent, BoopfunTradeEvent, ClassifiedInstruction, DexInfo, TradeInfo, TransferData } from '../../types';
import { BaseParser } from '../base-parser';
import { BoopfunEventParser } from './parser-boopfun-event';
import { getBoopfunTradeInfo } from './util';

/**
 * Parse Boopfun trades (BUY/SELL)
 */
export class BoopfunParser extends BaseParser {
  private eventParser: BoopfunEventParser;

  constructor(
    adapter: TransactionAdapter,
    dexInfo: DexInfo,
    transferActions: Record<string, TransferData[]>,
    classifiedInstructions: ClassifiedInstruction[]
  ) {
    super(adapter, dexInfo, transferActions, classifiedInstructions);
    this.eventParser = new BoopfunEventParser(adapter, transferActions);
  }

  public processTrades(): TradeInfo[] {
    const events = this.eventParser
      .parseInstructions(this.classifiedInstructions)
      .filter((event) => event.type === 'BUY' || event.type === 'SELL');
    return events.map((event) => this.createTradeInfo(event));
  }

  private createTradeInfo(data: BoopfunEvent): TradeInfo {
    const event = data.data as BoopfunTradeEvent;
    const trade = getBoopfunTradeInfo(event, {
      slot: data.slot,
      signature: data.signature,
      timestamp: data.timestamp,
      idx: data.idx,
      dexInfo: this.dexInfo,
    });

    return this.utils.attachTokenTransferInfo(trade, this.transferActions);
  }
}
