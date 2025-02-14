import { ParsedTransactionWithMeta } from "@solana/web3.js";
import { DEX_PROGRAMS, TOKENS } from "../constants";
import {
  convertToUiAmount,
  DexInfo,
  PumpfunTradeEvent,
  TradeInfo,
  TradeType,
} from "../types";
import { PumpfunEventParser } from "./parser-pumpfun-event";

export class PumpfunParser {
  private eventParser: PumpfunEventParser;

  constructor(
    private readonly txWithMeta: ParsedTransactionWithMeta,
    private readonly dexInfo?: DexInfo,
  ) {
    this.eventParser = new PumpfunEventParser(this.txWithMeta, dexInfo);
  }

  public processTrades(): TradeInfo[] {
    const events = this.eventParser
      .processEvents()
      .filter((it) => it.type == "TRADE")
      .flatMap((it) => it.data as PumpfunTradeEvent);
    return events.length > 0 ? this.processSwapData(events) : [];
  }

  public processInstructionTrades(instructionIndex: number): TradeInfo[] {
    const events = this.parseInnerInstructions(instructionIndex);
    return this.processSwapData(events);
  }

  private parseInnerInstructions(
    instructionIndex: number,
  ): PumpfunTradeEvent[] {
    return this.eventParser
      .parseInnerInstructions(instructionIndex)
      .filter((it) => it.type == "TRADE")
      .flatMap((it) => it.data as PumpfunTradeEvent);
  }

  private processSwapData(events: PumpfunTradeEvent[]): TradeInfo[] {
    if (!events.length) return [];
    return events.map((event) => this.createTradeInfo(event));
  }

  private createTradeInfo(event: PumpfunTradeEvent): TradeInfo {
    const tradeType: TradeType = event.isBuy ? "BUY" : "SELL";
    const isBuy = tradeType === "BUY";

    return {
      type: tradeType,
      inputToken: {
        mint: isBuy ? event.mint.toBase58() : TOKENS.SOL,
        amount: isBuy
          ? convertToUiAmount(event.tokenAmount, 6)
          : convertToUiAmount(event.solAmount, 9),
        decimals: isBuy ? 6 : 9,
      },
      outputToken: {
        mint: isBuy ? TOKENS.SOL : event.mint.toBase58(),
        amount: isBuy
          ? convertToUiAmount(event.solAmount, 9)
          : convertToUiAmount(event.tokenAmount, 6),
        decimals: isBuy ? 9 : 6,
      },
      user: event.user.toBase58(),
      programId: DEX_PROGRAMS.PUMP_FUN.id,
      amm: DEX_PROGRAMS.PUMP_FUN.name,
      slot: this.txWithMeta.slot,
      timestamp: this.txWithMeta.blockTime || 0,
      signature: this.txWithMeta.transaction.signatures[0],
    };
  }
}
