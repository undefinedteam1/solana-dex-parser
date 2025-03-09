import { DEX_PROGRAMS, DISCRIMINATORS, TOKENS } from '../constants';
import { convertToUiAmount, DexInfo, TokenAmount, TradeInfo, TradeType, TransferData } from '../types';
import { absBigInt, getInstructionData } from '../utils';
import { TransactionAdapter } from '../transaction-adapter';
import { TransactionUtils } from '../transaction-utils';

export class MoonshotParser {
  private readonly utils: TransactionUtils;

  constructor(
    private readonly adapter: TransactionAdapter,
    private readonly dexInfo: DexInfo,
    private readonly transferActions: Record<string, TransferData[]>
  ) {
    this.utils = new TransactionUtils(adapter);
  }

  public processTrades(): TradeInfo[] {
    const trades: TradeInfo[] = [];
    const instructions = this.adapter.instructions;

    instructions.forEach((instruction: any, index: number) => {
      if (this.isTradeInstruction(instruction)) {
        trades.push(...this.processInstructionTrades(instruction, index));
      }
    });

    return trades;
  }

  public processInstructionTrades(instruction: any, outerIndex: number): TradeInfo[] {
    const trades: TradeInfo[] = [];

    // outer instruction
    const instructions = this.adapter.instructions;
    trades.push(
      ...instructions
        .filter((instruction: any, index: number) => outerIndex == index && this.isTradeInstruction(instruction))
        .map((instruction: any, index: any) => this.parseTradeInstruction(instruction, `${outerIndex}-${index}`))
        .filter((transfer: any): transfer is TradeInfo => transfer !== null)
    );

    // inner instruction
    const innerInstructions = this.adapter.innerInstructions;
    if (innerInstructions) {
      trades.push(
        ...innerInstructions
          .filter((set) => set.index === outerIndex)
          .flatMap((set) =>
            set.instructions
              .map((instruction, index) => this.parseTradeInstruction(instruction, `${outerIndex}-${index}`))
              .filter((transfer): transfer is TradeInfo => transfer !== null)
          )
      );
    }

    return trades;
  }

  public isTradeInstruction(instruction: any): boolean {
    const programId = this.adapter.getInstructionProgramId(instruction);
    const accounts = this.adapter.getInstructionAccounts(instruction);
    return programId == DEX_PROGRAMS.MOONSHOT.id && accounts && accounts.length === 11;
  }

  private detectCollateralMint(accountKeys: string[]): string {
    if (accountKeys.some((key) => key == TOKENS.USDC)) {
      return TOKENS.USDC;
    }
    if (accountKeys.some((key) => key == TOKENS.USDT)) {
      return TOKENS.USDT;
    }
    return TOKENS.SOL;
  }

  private parseTradeInstruction(instruction: any, idx: string): TradeInfo | null {
    if (!('data' in instruction)) return null;

    const data = getInstructionData(instruction);
    const discriminator = data.slice(0, 8);
    let tradeType: TradeType;

    if (discriminator.equals(DISCRIMINATORS.MOONSHOT.BUY)) {
      tradeType = 'BUY';
    } else if (discriminator.equals(DISCRIMINATORS.MOONSHOT.SELL)) {
      tradeType = 'SELL';
    } else {
      return null;
    }

    const moonshotTokenMint = this.adapter.getInstructionAccounts(instruction)[6]; // meme
    const accountKeys = this.adapter.accountKeys;
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
    const trade: TradeInfo = {
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
      user: this.adapter.signer,
      programId: DEX_PROGRAMS.MOONSHOT.id,
      amm: DEX_PROGRAMS.MOONSHOT.name,
      route: this.dexInfo.route || '',
      slot: this.adapter.slot,
      timestamp: this.adapter.blockTime,
      signature: this.adapter.signature,
      idx,
    };

    return this.utils.attachTokenTransferInfo(trade, this.transferActions);
  }

  private getTokenBalanceChanges(mint: string): bigint {
    const signer = this.adapter.signer;

    if (mint == TOKENS.SOL) {
      if (!this.adapter.postBalances?.[0] || !this.adapter.preBalances?.[0]) {
        throw new Error('Insufficient balance information for SOL');
      }
      return BigInt(this.adapter.postBalances[0] - this.adapter.preBalances[0]);
    }

    let preAmount = BigInt(0);
    let postAmount = BigInt(0);
    let balanceFound = false;

    this.adapter.preTokenBalances?.forEach((preBalance) => {
      if (preBalance.mint == mint && preBalance.owner == signer) {
        preAmount = BigInt(preBalance.uiTokenAmount.amount);
        balanceFound = true;
      }
    });

    this.adapter.postTokenBalances?.forEach((postBalance) => {
      if (postBalance.mint == mint && postBalance.owner == signer) {
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
    const decimals = this.adapter.getTokenDecimals(mint);
    return {
      amount,
      uiAmount: convertToUiAmount(amount, decimals),
      decimals,
    };
  }
}
