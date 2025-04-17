import { TransactionAdapter } from '../../transaction-adapter';
import {
  ClassifiedInstruction,
  DexInfo,
  PumpswapBuyEvent,
  PumpswapEvent,
  PumpswapSellEvent,
  TradeInfo,
  TransferData,
} from '../../types';
import { BaseParser } from '../base-parser';
import { PumpswapEventParser } from './parser-pumpswap-event';
import { getPumpswapBuyInfo, getPumpswapSellInfo } from './util';

export class PumpswapParser extends BaseParser {
  private eventParser: PumpswapEventParser;

  constructor(
    adapter: TransactionAdapter,
    dexInfo: DexInfo,
    transferActions: Record<string, TransferData[]>,
    classifiedInstructions: ClassifiedInstruction[]
  ) {
    super(adapter, dexInfo, transferActions, classifiedInstructions);
    this.eventParser = new PumpswapEventParser(adapter);
  }

  public processTrades(): TradeInfo[] {
    const events = this.eventParser
      .parseInstructions(this.classifiedInstructions)
      .filter((event) => ['BUY', 'SELL'].includes(event.type));

    return events.map((event) => (event.type === 'BUY' ? this.createBuyInfo(event) : this.createSellInfo(event)));
  }

  private createBuyInfo(data: PumpswapEvent): TradeInfo {
    const event = data.data as PumpswapBuyEvent;
    const inputMint = this.adapter.splTokenMap.get(event.userQuoteTokenAccount)!.mint;
    const inputDecimal = this.adapter.getTokenDecimals(inputMint);
    const outputMint = this.adapter.splTokenMap.get(event.userBaseTokenAccount)!.mint;
    const ouptDecimal = this.adapter.getTokenDecimals(outputMint);

    const trade = getPumpswapBuyInfo(
      event,
      { mint: inputMint, decimals: inputDecimal },
      { mint: outputMint, decimals: ouptDecimal },
      {
        slot: data.slot,
        signature: data.signature,
        timestamp: data.timestamp,
        idx: data.idx,
        dexInfo: this.dexInfo,
      }
    );

    return this.utils.attachTokenTransferInfo(trade, this.transferActions);
  }

  private createSellInfo(data: PumpswapEvent): TradeInfo {
    const event = data.data as PumpswapSellEvent;
    const inputMint = this.adapter.splTokenMap.get(event.userBaseTokenAccount)!.mint;
    const inputDecimal = this.adapter.getTokenDecimals(inputMint);
    const outputMint = this.adapter.splTokenMap.get(event.userQuoteTokenAccount)!.mint;
    const ouptDecimal = this.adapter.getTokenDecimals(outputMint);

    const trade = getPumpswapSellInfo(
      event,
      { mint: inputMint, decimals: inputDecimal },
      { mint: outputMint, decimals: ouptDecimal },
      {
        slot: data.slot,
        signature: data.signature,
        timestamp: data.timestamp,
        idx: data.idx,
        dexInfo: this.dexInfo,
      }
    );

    return this.utils.attachTokenTransferInfo(trade, this.transferActions);
  }
}
