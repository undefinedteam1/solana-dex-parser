import { DEX_PROGRAMS } from '../constants';
import {
  convertToUiAmount,
  DexInfo,
  PumpswapBuyEvent,
  PumpswapEvent,
  PumpswapSellEvent,
  TradeInfo,
  TransferData,
} from '../types';
import { PumpswapEventParser } from './parser-pumpswap-event';
import { TransactionAdapter } from '../transaction-adapter';
import { TransactionUtils } from '../transaction-utils';

export class PumpswapParser {
  private eventParser: PumpswapEventParser;
  private readonly utils: TransactionUtils;

  constructor(
    private readonly adapter: TransactionAdapter,
    private readonly dexInfo: DexInfo,
    private readonly transferActions: Record<string, TransferData[]>
  ) {
    this.utils = new TransactionUtils(adapter);
    this.eventParser = new PumpswapEventParser(this.adapter);
  }

  public processTrades(): TradeInfo[] {
    const events = this.eventParser.processEvents().filter((it) => ['BUY', 'SELL'].includes(it.type));
    return events.length > 0 ? this.processSwapData(events) : [];
  }

  public parseTransferAction(transfer: [string, TransferData[]]): TradeInfo[] {
    const [, idxs] = transfer[0].split(':');
    const [outerIndex] = idxs.split('-');
    const events = this.parseInnerInstructions(Number(outerIndex));
    return events.length > 0 ? this.processSwapData(events) : [];
  }

  private parseInnerInstructions(instructionIndex: number): PumpswapEvent[] {
    return this.eventParser.processInnerInstruction(instructionIndex).filter((it) => ['BUY', 'SELL'].includes(it.type));
  }

  private processSwapData(events: PumpswapEvent[]): TradeInfo[] {
    if (!events.length) return [];
    return events.map((event) => (event.type == 'BUY' ? this.createBuyInfo(event) : this.createSellInfo(event)));
  }

  private createBuyInfo(data: PumpswapEvent): TradeInfo {
    const event = data.data as PumpswapBuyEvent;
    const inputMint = this.adapter.splTokenMap.get(event.userQuoteTokenAccount)!.mint;
    const inputDecimal = this.adapter.getTokenDecimals(inputMint);
    const outputMint = this.adapter.splTokenMap.get(event.userBaseTokenAccount)!.mint;
    const ouptDecimal = this.adapter.getTokenDecimals(outputMint);
    const trade: TradeInfo = {
      type: 'BUY',
      inputToken: {
        mint: inputMint,
        amount: convertToUiAmount(event.quoteAmountInWithLpFee, inputDecimal),
        decimals: inputDecimal,
      },
      outputToken: {
        mint: outputMint,
        amount: convertToUiAmount(event.baseAmountOut, ouptDecimal),
        decimals: ouptDecimal,
      },
      fee: {
        mint: inputMint,
        amount: convertToUiAmount(event.protocolFee, inputDecimal),
        decimals: inputDecimal,
      },
      user: event.user,
      programId: this.dexInfo.programId || DEX_PROGRAMS.PUMP_SWAP.id,
      amm: DEX_PROGRAMS.PUMP_SWAP.name,
      route: this.dexInfo.route || '',
      slot: data.slot,
      timestamp: data.timestamp,
      signature: data.signature,
      idx: data.idx,
    };

    return this.utils.attachTokenTransferInfo(trade, this.transferActions);
  }

  private createSellInfo(data: PumpswapEvent): TradeInfo {
    const event = data.data as PumpswapSellEvent;
    const inputMint = this.adapter.splTokenMap.get(event.userBaseTokenAccount)!.mint;
    const inputDecimal = this.adapter.getTokenDecimals(inputMint);
    const outputMint = this.adapter.splTokenMap.get(event.userQuoteTokenAccount)!.mint;
    const ouptDecimal = this.adapter.getTokenDecimals(outputMint);
    const trade: TradeInfo = {
      type: 'SELL',
      inputToken: {
        mint: inputMint,
        amount: convertToUiAmount(event.baseAmountIn, inputDecimal),
        decimals: inputDecimal,
      },
      outputToken: {
        mint: outputMint,
        amount: convertToUiAmount(event.userQuoteAmountOut, ouptDecimal),
        decimals: ouptDecimal,
      },
      fee: {
        mint: outputMint,
        amount: convertToUiAmount(event.protocolFee, ouptDecimal),
        decimals: ouptDecimal,
      },
      user: event.user,
      programId: this.dexInfo.programId || DEX_PROGRAMS.PUMP_SWAP.id,
      amm: DEX_PROGRAMS.PUMP_SWAP.name,
      route: this.dexInfo.route || '',
      slot: data.slot,
      timestamp: data.timestamp,
      signature: data.signature,
      idx: data.idx,
    };

    return this.utils.attachTokenTransferInfo(trade, this.transferActions);
  }
}
