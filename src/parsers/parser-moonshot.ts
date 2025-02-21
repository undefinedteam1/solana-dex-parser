import {
  ParsedMessageAccount,
  ParsedTransactionWithMeta,
  PartiallyDecodedInstruction,
} from "@solana/web3.js";
import { decode as base58Decode } from "bs58";
import {
  DEX_PROGRAMS,
  DISCRIMINATORS,
  TOKEN_DECIMALS,
  TOKENS,
} from "../constants";
import {
  convertToUiAmount,
  DexInfo,
  TokenAmount,
  TradeInfo,
  TradeType,
} from "../types";

enum CollateralType {
  SOL,
  USDC,
  USDT,
}

export class MoonshotParser {
  constructor(
    private readonly txWithMeta: ParsedTransactionWithMeta,
    private readonly dexInfo: DexInfo,
  ) {}

  public processTrades(): TradeInfo[] {
    const trades: TradeInfo[] = [];
    const instructions = this.txWithMeta.transaction.message.instructions;

    instructions.forEach((it: any, index: number) => {
      if (this.isTrade(it)) {
        trades.push(...this.processInstructionTrades(index));
      }
    });

    return trades;
  }

  public processInstructionTrades(instructionIndex: number): TradeInfo[] {
    const trades: TradeInfo[] = [];

    // outer instruction
    const instructions = this.txWithMeta.transaction.message.instructions;
    trades.push(
      ...instructions
        .filter(
          (instruction, index) =>
            instructionIndex == index && this.isTrade(instruction),
        )
        .map((instruction, index) =>
          this.parseTradeInstruction(
            instruction as PartiallyDecodedInstruction,
            `${instructionIndex}-${index}`,
          ),
        )
        .filter((transfer): transfer is TradeInfo => transfer !== null),
    );

    // inner instruction
    const innerInstructions = this.txWithMeta.meta?.innerInstructions;
    if (innerInstructions) {
      trades.push(
        ...innerInstructions
          .filter((set) => set.index === instructionIndex)
          .flatMap((set) =>
            set.instructions
              .map((instruction, index) =>
                this.parseTradeInstruction(
                  instruction as PartiallyDecodedInstruction,
                  `${instructionIndex}-${index}`,
                ),
              )
              .filter((transfer): transfer is TradeInfo => transfer !== null),
          ),
      );
    }

    return trades;
  }

  private isTrade(instruction: any): boolean {
    const programId =
      instruction.programId ||
      this.txWithMeta.transaction.message.accountKeys[
        instruction.programIdIndex
      ];
    return (
      programId.toBase58() == DEX_PROGRAMS.MOONSHOT.id &&
      instruction.accounts.length === 11
    );
  }

  private detectCollateralType(
    accountKeys: ParsedMessageAccount[],
  ): CollateralType {
    if (accountKeys.some((key) => key.pubkey.toBase58() == TOKENS.USDC)) {
      return CollateralType.USDC;
    }
    if (accountKeys.some((key) => key.pubkey.toBase58() == TOKENS.USDT)) {
      return CollateralType.USDT;
    }
    return CollateralType.SOL;
  }

  private parseTradeInstruction(
    instruction: any,
    idx: string,
  ): TradeInfo | null {
    if (!("data" in instruction)) return null;

    const decodedData = base58Decode(instruction.data);
    const discriminator = decodedData.slice(0, 8);
    let tradeType: TradeType;

    if (Buffer.from(discriminator).equals(DISCRIMINATORS.MOONSHOT.BUY)) {
      tradeType = "BUY";
    } else if (
      Buffer.from(discriminator).equals(DISCRIMINATORS.MOONSHOT.SELL)
    ) {
      tradeType = "SELL";
    } else {
      return null;
    }

    const moonshotTokenMint = instruction.accounts[6];
    const accountKeys = this.txWithMeta.transaction.message.accountKeys;
    const collateralType = this.detectCollateralType(accountKeys);

    const collateralMint = this.getCollateralMint(collateralType);
    const { tokenAmount, collateralAmount } = this.calculateAmounts(
      moonshotTokenMint,
      collateralMint,
    );

    return this.createTradeInfo(
      tradeType,
      tokenAmount,
      collateralAmount,
      moonshotTokenMint,
      collateralMint,
      idx,
    );
  }

  private getCollateralMint(collateralType: CollateralType): string {
    switch (collateralType) {
      case CollateralType.USDC:
        return TOKENS.USDC;
      case CollateralType.USDT:
        return TOKENS.USDT;
      default:
        return TOKENS.SOL;
    }
  }

  private calculateAmounts(tokenMint: string, collateralMint: string) {
    const tokenBalanceChanges = this.getTokenBalanceChanges(tokenMint);
    const collateralBalanceChanges =
      this.getTokenBalanceChanges(collateralMint);

    return {
      tokenAmount: this.createTokenAmount(
        BigInt(Math.abs(Number(tokenBalanceChanges))),
        tokenMint,
      ),
      collateralAmount: this.createTokenAmount(
        BigInt(Math.abs(Number(collateralBalanceChanges))),
        collateralMint,
      ),
    };
  }

  private createTradeInfo(
    tradeType: TradeType,
    tokenAmount: TokenAmount,
    collateralAmount: TokenAmount,
    moonshotTokenMint: string,
    collateralMint: string,
    idx: string,
  ): TradeInfo {
    return {
      type: tradeType,
      inputToken: {
        mint: tradeType == "BUY" ? moonshotTokenMint : collateralMint,
        amount:
          tradeType == "BUY" ? tokenAmount.uiAmount : collateralAmount.uiAmount,
        decimals:
          tradeType == "BUY" ? tokenAmount.decimals : collateralAmount.decimals,
      },
      outputToken: {
        mint: tradeType == "SELL" ? moonshotTokenMint : collateralMint,
        amount:
          tradeType == "SELL"
            ? tokenAmount.uiAmount
            : collateralAmount.uiAmount,
        decimals:
          tradeType == "SELL"
            ? tokenAmount.decimals
            : collateralAmount.decimals,
      },
      user: this.txWithMeta.transaction.message.accountKeys[0].pubkey.toBase58(),
      programId: DEX_PROGRAMS.MOONSHOT.id,
      amm: DEX_PROGRAMS.MOONSHOT.name,
      slot: this.txWithMeta.slot,
      timestamp: this.txWithMeta.blockTime || 0,
      signature: this.txWithMeta.transaction.signatures[0],
      idx,
    };
  }

  private getTokenBalanceChanges(mint: string): bigint {
    const signer = this.txWithMeta.transaction.message.accountKeys[0];
    const signerPubkey = signer.pubkey.toBase58();

    if (mint == TOKENS.SOL) {
      const meta = this.txWithMeta.meta;
      if (!meta?.postBalances?.[0] || !meta?.preBalances?.[0]) {
        throw new Error("Insufficient balance information for SOL");
      }
      return BigInt(meta.postBalances[0] - meta.preBalances[0]);
    }

    let preAmount = BigInt(0);
    let postAmount = BigInt(0);
    let balanceFound = false;

    this.txWithMeta.meta?.preTokenBalances?.forEach((preBalance) => {
      if (preBalance.mint == mint && preBalance.owner == signerPubkey) {
        preAmount = BigInt(preBalance.uiTokenAmount.amount);
        balanceFound = true;
      }
    });

    this.txWithMeta.meta?.postTokenBalances?.forEach((postBalance) => {
      if (postBalance.mint == mint && postBalance.owner == signerPubkey) {
        postAmount = BigInt(postBalance.uiTokenAmount.amount);
        balanceFound = true;
      }
    });

    if (!balanceFound) {
      throw new Error("Could not find balance for specified mint and signer");
    }

    return postAmount - preAmount;
  }

  private getTokenDecimals(mint: string): number {
    const decimals = TOKEN_DECIMALS[mint];
    if (typeof decimals === "undefined") {
      const tokenBalance = this.txWithMeta.meta?.preTokenBalances?.find(
        (balance) => balance.mint === mint,
      );
      if (tokenBalance?.uiTokenAmount.decimals) {
        return tokenBalance.uiTokenAmount.decimals;
      }
      return 9;
    }
    return decimals;
  }

  private createTokenAmount(amount: bigint, mint: string): TokenAmount {
    const decimals = this.getTokenDecimals(mint);
    return {
      amount,
      uiAmount: convertToUiAmount(amount, decimals),
      decimals,
    };
  }
}
