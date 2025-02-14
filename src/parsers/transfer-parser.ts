import { ParsedTransactionWithMeta } from "@solana/web3.js";
import { TransferInfo } from "../types";
import { getBalanceChanges, getTokenDecimals } from "../utils";

export class TransferParser {
  public parseTransfers(tx: ParsedTransactionWithMeta): TransferInfo[] {
    const transfers: TransferInfo[] = [];
    const { preBalances, postBalances } = getBalanceChanges(tx);

    // Compare pre and post balances to detect transfers
    for (const [owner, mints] of Object.entries(postBalances)) {
      for (const [mint, postBalance] of Object.entries(mints)) {
        const preBalance = preBalances[owner]?.[mint] || 0;
        const difference = postBalance - preBalance;

        if (difference !== 0) {
          // Find the counterparty by looking for opposite balance change
          for (const [otherOwner, otherMints] of Object.entries(postBalances)) {
            if (otherOwner === owner) continue;
            const otherDiff =
              (otherMints[mint] || 0) - (preBalances[otherOwner]?.[mint] || 0);

            if (otherDiff === -difference) {
              transfers.push({
                type: difference > 0 ? "TRANSFER_IN" : "TRANSFER_OUT",
                token: {
                  mint,
                  amount: Math.abs(difference),
                  decimals: getTokenDecimals(tx, mint),
                },
                from: difference > 0 ? otherOwner : owner,
                to: difference > 0 ? owner : otherOwner,
                timestamp: tx.blockTime || 0,
                signature: tx.transaction.signatures[0],
              });
            }
          }
        }
      }
    }

    return transfers;
  }
}
