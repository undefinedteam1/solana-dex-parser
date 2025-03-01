import { ParsedMessageAccount, ParsedTransactionWithMeta, PartiallyDecodedInstruction } from '@solana/web3.js';
import { decode as base58Decode } from 'bs58';
import { DEX_PROGRAMS, DISCRIMINATORS, TOKENS } from '../constants';
import { convertToUiAmount, DexInfo, TokenAmount, TradeInfo, TradeType } from '../types';
import { absBigInt, getTokenDecimals } from '../utils';

export class MoonshotParser {
  constructor(
    private readonly txWithMeta: ParsedTransactionWithMeta,
    private readonly dexInfo: DexInfo
  ) { }

  public processTrades(): TradeInfo[] {
    const trades: TradeInfo[] = [];
    const instructions = this.txWithMeta.transaction.message.instructions;

    instructions.forEach((instruction: any, index: number) => {
      if (this.isTradeInstruction(instruction)) {
        trades.push(...this.processInstructionTrades(instruction, index));
      }
    });

    return trades;
  }

  public processInstructionTrades(instruction: any, outerIndex: number, innerIndex?: number): TradeInfo[] {
    const trades: TradeInfo[] = [];

    // outer instruction
    const instructions = this.txWithMeta.transaction.message.instructions;
    trades.push(
      ...instructions
        .filter((instruction, index) => outerIndex == index && this.isTradeInstruction(instruction))
        .map((instruction, index) =>
          this.parseTradeInstruction(instruction as PartiallyDecodedInstruction, `${outerIndex}-${index}`)
        )
        .filter((transfer): transfer is TradeInfo => transfer !== null)
    );

    // inner instruction
    const innerInstructions = this.txWithMeta.meta?.innerInstructions;
    if (innerInstructions) {
      trades.push(
        ...innerInstructions
          .filter((set) => set.index === outerIndex)
          .flatMap((set) =>
            set.instructions
              .map((instruction, index) =>
                this.parseTradeInstruction(instruction as PartiallyDecodedInstruction, `${outerIndex}-${index}`)
              )
              .filter((transfer): transfer is TradeInfo => transfer !== null)
          )
      );
    }

    return trades;
  }

  public isTradeInstruction(instruction: any): boolean {
    const programId =
      instruction.programId || this.txWithMeta.transaction.message.accountKeys[instruction.programIdIndex];
    return programId.toBase58() == DEX_PROGRAMS.MOONSHOT.id && instruction.accounts.length === 11;
  }

  private detectCollateralMint(accountKeys: ParsedMessageAccount[]): string {
    if (accountKeys.some((key) => key.pubkey.toBase58() == TOKENS.USDC)) {
      return TOKENS.USDC;
    }
    if (accountKeys.some((key) => key.pubkey.toBase58() == TOKENS.USDT)) {
      return TOKENS.USDT;
    }
    return TOKENS.SOL;
  }

  private parseTradeInstruction(instruction: any, idx: string): TradeInfo | null {
    if (!('data' in instruction)) return null;

    const decodedData = base58Decode(instruction.data);
    const discriminator = decodedData.slice(0, 8);
    let tradeType: TradeType;

    if (Buffer.from(discriminator).equals(DISCRIMINATORS.MOONSHOT.BUY)) {
      tradeType = 'BUY';
    } else if (Buffer.from(discriminator).equals(DISCRIMINATORS.MOONSHOT.SELL)) {
      tradeType = 'SELL';
    } else {
      return null;
    }

    const moonshotTokenMint = instruction.accounts[6].toBase58(); // meme
    const accountKeys = this.txWithMeta.transaction.message.accountKeys;
    const collateralMint = this.detectCollateralMint(accountKeys);
    const { tokenAmount, collateralAmount } = this.calculateAmounts(moonshotTokenMint, collateralMint);

    return this.createTradeInfo(tradeType, tokenAmount, collateralAmount, moonshotTokenMint, collateralMint, idx);
  }

  private calculateAmounts(tokenMint: string, collateralMint: string) {
    const tokenBalanceChanges = this.getTokenBalanceChanges(tokenMint);
    const collateralBalanceChanges = this.getTokenBalanceChanges(collateralMint);

    return {
      tokenAmount: this.createTokenAmount(absBigInt(tokenBalanceChanges), tokenMint),
      collateralAmount: this.createTokenAmount(absBigInt(collateralBalanceChanges), collateralMint),
    };
  }

  private createTradeInfo(
    tradeType: TradeType,
    tokenAmount: TokenAmount,
    collateralAmount: TokenAmount,
    moonshotTokenMint: string,
    collateralMint: string,
    idx: string
  ): TradeInfo {
    return {
      type: tradeType,
      inputToken: {
        mint: tradeType == 'BUY' ? collateralMint : moonshotTokenMint,
        amount: tradeType == 'BUY' ? collateralAmount.uiAmount : tokenAmount.uiAmount,
        decimals: tradeType == 'BUY' ? collateralAmount.decimals : tokenAmount.decimals,
      },
      outputToken: {
        mint: tradeType == 'BUY' ? moonshotTokenMint : collateralMint,
        amount: tradeType == 'BUY' ? tokenAmount.uiAmount : collateralAmount.uiAmount,
        decimals: tradeType == 'BUY' ? tokenAmount.decimals : collateralAmount.decimals,
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
        throw new Error('Insufficient balance information for SOL');
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
      throw new Error('Could not find balance for specified mint and signer');
    }

    return postAmount - preAmount;
  }


  private createTokenAmount(amount: bigint, mint: string): TokenAmount {
    const decimals = getTokenDecimals(this.txWithMeta, mint);
    return {
      amount,
      uiAmount: convertToUiAmount(amount, decimals),
      decimals,
    };
  }
}
