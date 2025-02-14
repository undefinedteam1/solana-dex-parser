import {
  ParsedInstruction,
  ParsedTransactionWithMeta,
  PublicKey,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { TokenInfo } from "./types";
import { TOKENS } from "./constants";

interface TokenBalance {
  mint: string;
  accountIndex: number;
  uiTokenAmount: {
    decimals: number;
  };
}

export class TokenInfoExtractor {
  private readonly defaultSolInfo: TokenInfo = {
    mint: TOKENS.SOL,
    amount: 0,
    decimals: 9,
  };

  constructor(private readonly txWithMeta: ParsedTransactionWithMeta) {}

  public extractSPLTokenInfo(): Map<string, TokenInfo> {
    const splTokenAddresses = new Map<string, TokenInfo>();
    const allAccountKeys = this.txWithMeta.transaction.message.accountKeys;

    this.processPostTokenBalances(splTokenAddresses, allAccountKeys);
    this.processInstructions(splTokenAddresses);
    this.fillMissingTokenInfo(splTokenAddresses);

    return splTokenAddresses;
  }

  private processPostTokenBalances(
    tokenMap: Map<string, TokenInfo>,
    accountKeys: Array<{ pubkey: PublicKey }>,
  ): void {
    (this.txWithMeta.meta?.postTokenBalances || []).forEach((accountInfo) => {
      if (accountInfo.mint) {
        const accountKey =
          accountKeys[accountInfo.accountIndex].pubkey.toBase58();
        tokenMap.set(accountKey, {
          mint: accountInfo.mint.toString(),
          amount: 0,
          decimals: accountInfo.uiTokenAmount.decimals,
        });
      }
    });
  }

  private processInstructions(tokenMap: Map<string, TokenInfo>): void {
    const processInstruction = (instr: ParsedInstruction) => {
      if (!instr.programId.equals(TOKEN_PROGRAM_ID)) return;

      const { source, destination } = instr.parsed?.info || {};
      if (!source && !destination) return;

      const emptyTokenInfo = { mint: "", amount: 0, decimals: 0 };

      if (source && !tokenMap.has(source)) {
        tokenMap.set(source, emptyTokenInfo);
      }
      if (destination && !tokenMap.has(destination)) {
        tokenMap.set(destination, emptyTokenInfo);
      }
    };

    // Process main and inner instructions
    this.getAllInstructions().forEach((instruction) => {
      processInstruction(instruction as ParsedInstruction);
    });
  }

  private getAllInstructions(): ParsedInstruction[] {
    const mainInstructions = this.txWithMeta.transaction.message.instructions;
    const innerInstructions = (
      this.txWithMeta.meta?.innerInstructions || []
    ).flatMap((set) => set.instructions);

    return [...mainInstructions, ...innerInstructions] as ParsedInstruction[];
  }

  private fillMissingTokenInfo(tokenMap: Map<string, TokenInfo>): void {
    tokenMap.forEach((info, account) => {
      if (!info.mint) {
        tokenMap.set(account, this.defaultSolInfo);
      }
    });
  }

  public extractTokenInfo(): Map<string, TokenInfo> {
    try {
      const tokenMap = new Map<string, TokenInfo>();

      this.getPostTokenBalances().forEach((balance) => {
        if (balance.mint) {
          const mintAddress = balance.mint.toString();
          tokenMap.set(mintAddress, {
            mint: mintAddress,
            amount: 0,
            decimals: balance.uiTokenAmount.decimals,
          });
        }
      });

      if (!tokenMap.has(TOKENS.SOL)) {
        tokenMap.set(TOKENS.SOL, this.defaultSolInfo);
      }

      return tokenMap;
    } catch (error) {
      throw this.formatError("extract token info", error);
    }
  }

  public extractDecimals(): Map<string, number> {
    try {
      const decimalsMap = new Map<string, number>();

      this.getPostTokenBalances().forEach((balance) => {
        if (balance.mint) {
          decimalsMap.set(
            balance.mint.toString(),
            balance.uiTokenAmount.decimals,
          );
        }
      });

      if (!decimalsMap.has(TOKENS.SOL)) {
        decimalsMap.set(TOKENS.SOL, this.defaultSolInfo.decimals);
      }

      return decimalsMap;
    } catch (error) {
      throw this.formatError("extract decimals", error);
    }
  }

  public getDecimals(mint: string): number {
    return (
      this.getPostTokenBalances().find((balance) => balance.mint === mint)
        ?.uiTokenAmount.decimals ??
      (mint === TOKENS.SOL ? this.defaultSolInfo.decimals : 0)
    );
  }

  public validateTokenInfo(requiredMints: PublicKey[]): void {
    const balances = this.getPostTokenBalances();
    const missingMints = requiredMints.filter((mint) => {
      const mintStr = mint.toString();
      return (
        !balances.some((balance) => balance.mint.toString() === mintStr) &&
        mint.toBase58() !== TOKENS.SOL
      );
    });

    if (missingMints.length > 0) {
      throw this.formatError(
        "validate token info",
        `Missing token info for mints: ${missingMints.map((m) => m.toString()).join(", ")}`,
      );
    }
  }

  private getPostTokenBalances(): TokenBalance[] {
    return this.txWithMeta.meta?.postTokenBalances || [];
  }

  private formatError(operation: string, error: unknown): string {
    return `Failed to ${operation}: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}
