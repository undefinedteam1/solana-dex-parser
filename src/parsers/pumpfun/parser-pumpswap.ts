import { DEX_PROGRAMS } from "../../constants";
import { TransactionAdapter } from "../../transaction-adapter";
import { ClassifiedInstruction, convertToUiAmount, DexInfo, PumpswapBuyEvent, PumpswapEvent, PumpswapSellEvent, TradeInfo, TransferData } from "../../types";
import { BaseParser } from "../base-parser";
import { PumpswapEventParser } from "./parser-pumpswap-event";

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
      .filter(event => ['BUY', 'SELL'].includes(event.type));

    return events.map(event => 
      event.type === 'BUY' ? this.createBuyInfo(event) : this.createSellInfo(event)
    );
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
