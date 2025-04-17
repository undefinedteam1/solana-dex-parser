import { TransactionAdapter } from '../../transaction-adapter';
import { ClassifiedInstruction, DexInfo, PumpfunEvent, PumpfunTradeEvent, TradeInfo, TransferData } from '../../types';
import { BaseParser } from '../base-parser';
import { PumpfunEventParser } from './parser-pumpfun-event';
import { getPumpfunTradeInfo } from './util';

export class PumpfunParser extends BaseParser {
  private eventParser: PumpfunEventParser;

  constructor(
    adapter: TransactionAdapter,
    dexInfo: DexInfo,
    transferActions: Record<string, TransferData[]>,
    classifiedInstructions: ClassifiedInstruction[]
  ) {
    super(adapter, dexInfo, transferActions, classifiedInstructions);
    this.eventParser = new PumpfunEventParser(adapter);
  }

  public processTrades(): TradeInfo[] {
    const events = this.eventParser
      .parseInstructions(this.classifiedInstructions)
      .filter((event) => event.type === 'TRADE');

    return events.map((event) => this.createTradeInfo(event));
  }

  private createTradeInfo(data: PumpfunEvent): TradeInfo {
    const event = data.data as PumpfunTradeEvent;
    const trade = getPumpfunTradeInfo(event, {
      slot: data.slot,
      signature: data.signature,
      timestamp: data.timestamp,
      idx: data.idx,
      dexInfo: this.dexInfo,
    });

    return this.utils.attachTokenTransferInfo(trade, this.transferActions);
  }
}
