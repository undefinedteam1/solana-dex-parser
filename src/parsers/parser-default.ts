import { ParsedTransactionWithMeta } from "@solana/web3.js";
import { TradeInfo } from "../types";
import {
  getBalanceChanges,
  getDexInfo,
  getTokenDecimals,
  isSupportedToken,
} from "../utils";

/**
 * BalanceChanges Parser
 */
export class DefaultParser {
  constructor(private readonly txWithMeta: ParsedTransactionWithMeta) {}

  public processTrades(): TradeInfo[] {
    return this.parseTradesByBalanceChanges(
      this.txWithMeta,
      getDexInfo(this.txWithMeta),
    );
  }

  public parseTradesByBalanceChanges(
    tx: ParsedTransactionWithMeta,
    dexInfo: { programId?: string; amm?: string },
  ): TradeInfo[] {
    const { preBalances, postBalances } = getBalanceChanges(tx);
    const trades: TradeInfo[] = [];
    const signer = tx.transaction.message.accountKeys[0].pubkey.toBase58();
    Object.entries(postBalances).forEach(([owner, mints]) => {
      const changes = this.getSignificantChanges(
        mints,
        preBalances[owner] || {},
      );

      if (changes.length !== 2) return;
      const [token1, token2] = changes;

      if (signer != owner) return;

      const trade = this.createTradeInfo(token1, token2, owner, tx, dexInfo);
      if (trade) trades.push(trade);
    });

    return trades;
  }

  private getSignificantChanges(
    postMints: Record<string, number>,
    preMints: Record<string, number>,
  ) {
    return Object.entries(postMints)
      .map(([mint, postBalance]) => ({
        mint,
        diff: postBalance - (preMints[mint] || 0),
      }))
      .filter(({ diff }) => diff !== 0);
  }

  private createTradeInfo(
    token1: { mint: string; diff: number },
    token2: { mint: string; diff: number },
    owner: string,
    tx: ParsedTransactionWithMeta,
    dexInfo: { programId?: string; amm?: string },
  ): TradeInfo | null {
    const baseTradeInfo = {
      user: owner,
      programId: dexInfo.programId,
      amm: dexInfo.amm || "",
      slot: tx.slot,
      timestamp: tx.blockTime || 0,
      signature: tx.transaction.signatures[0],
    };

    if (token1.diff < 0 && token2.diff > 0) {
      return {
        type: isSupportedToken(token1.mint) ? "SELL" : "BUY",
        inputToken: this.formatToken(token1, tx),
        outputToken: this.formatToken(token2, tx),
        ...baseTradeInfo,
      };
    }

    if (token1.diff > 0 && token2.diff < 0) {
      return {
        type: isSupportedToken(token1.mint) ? "BUY" : "SELL",
        inputToken: this.formatToken(token2, tx),
        outputToken: this.formatToken(token1, tx),
        ...baseTradeInfo,
      };
    }

    return null;
  }

  private formatToken(
    token: { mint: string; diff: number },
    tx: ParsedTransactionWithMeta,
  ) {
    return {
      mint: token.mint,
      amount: Math.abs(token.diff),
      decimals: getTokenDecimals(tx, token.mint),
    };
  }
}
