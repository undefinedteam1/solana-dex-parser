import { ParsedTransactionWithMeta } from '@solana/web3.js';
import { DEX_PROGRAMS, DISCRIMINATORS } from '../constants';
import { DexInfo, TokenInfo, TradeInfo } from '../types';
import { TokenInfoExtractor } from '../token-extractor';
import { processSwapData, processTransferInnerInstruction } from '../transfer-utils';
import base58 from 'bs58';

export class RaydiumParser {
  private readonly splTokenMap: Map<string, TokenInfo>;
  private readonly splDecimalsMap: Map<string, number>;

  constructor(
    private readonly txWithMeta: ParsedTransactionWithMeta,
    private readonly dexInfo: DexInfo
  ) {
    const tokenExtractor = new TokenInfoExtractor(txWithMeta);
    this.splTokenMap = tokenExtractor.extractSPLTokenInfo();
    this.splDecimalsMap = tokenExtractor.extractDecimals();
  }

  public processTrades(): TradeInfo[] {
    return this.txWithMeta.transaction.message.instructions.reduce(
      (trades: TradeInfo[], instruction: any, index: number) => {
        if (this.isTradeInstruction(instruction)) {
          const instructionTrades = this.processInstructionTrades(index);
          trades.push(...instructionTrades);
        }
        return trades;
      },
      []
    );
  }

  public processInstructionTrades(instructionIndex: number): TradeInfo[] {
    try {
      const transfers = processTransferInnerInstruction(
        this.txWithMeta,
        instructionIndex,
        this.splTokenMap,
        this.splDecimalsMap
      );
      return transfers.length ? [processSwapData(this.txWithMeta, transfers, this.dexInfo)] : [];
    } catch (error) {
      console.error('Error processing Raydium trades:', error);
      return [];
    }
  }

  public isTradeInstruction(instruction: any): boolean {
    const programId = instruction.programId.toBase58();
    return (
      [
        DEX_PROGRAMS.RAYDIUM_V4.id,
        DEX_PROGRAMS.RAYDIUM_AMM.id,
        DEX_PROGRAMS.RAYDIUM_CL.id,
        DEX_PROGRAMS.RAYDIUM_CPMM.id,
      ].includes(programId) && this.isLiquidityEvent(instruction) == false
    );
  }

  private isLiquidityEvent(instruction: any): boolean {
    if (instruction.data) {
      const data = base58.decode(instruction.data as string);
      const a = Object.values(DISCRIMINATORS.RAYDIUM).find((it) => data.slice(0, 1).equals(it));
      const b = Object.values(DISCRIMINATORS.RAYDIUM_CL)
        .flatMap((it) => Object.values(it))
        .find((it) => data.slice(0, 8).equals(it));
      const c = Object.values(DISCRIMINATORS.RAYDIUM_CPMM).find((it) => data.slice(0, 8).equals(it));
      return a != undefined || b != undefined || c != undefined;
    }
    return false;
  }
}
