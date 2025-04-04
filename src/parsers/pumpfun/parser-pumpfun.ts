import { DEX_PROGRAMS, TOKENS } from '../../constants';
import { TransactionAdapter } from '../../transaction-adapter';
import {
  ClassifiedInstruction,
  DexInfo,
  PumpfunEvent,
  PumpfunTradeEvent,
  TradeInfo,
  TradeType,
  TransferData,
} from '../../types';
import { BaseParser } from '../base-parser';
import { PumpfunEventParser } from './parser-pumpfun-event';

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

    return this.utils.attachTokenTransferInfo(trade, this.transferActions);
  }
}
