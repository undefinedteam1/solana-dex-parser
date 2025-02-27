import { ParsedInstruction, ParsedTransactionWithMeta } from '@solana/web3.js';
import { DEX_PROGRAMS, DISCRIMINATORS } from '../constants';
import { DexInfo, TokenInfo, TradeInfo, TransferData } from '../types';
import { TokenInfoExtractor } from '../token-extractor';
import { isTransfer, isTransferCheck, processSwapData, processTransfer, processTransferCheck } from '../transfer-utils';
import base58 from 'bs58';

export class MeteoraParser {
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
      const transfers = this.processMeteoraSwaps(instructionIndex);
      return transfers.length ? [processSwapData(this.txWithMeta, transfers, this.dexInfo)] : [];
    } catch (error) {
      console.error('Error processing Meteora trades:', error);
      return [];
    }
  }

  public isTradeInstruction(instruction: any): boolean {
    const programId = instruction.programId.toBase58();
    return (
      [DEX_PROGRAMS.METEORA.id, DEX_PROGRAMS.METEORA_POOLS.id].includes(programId) &&
      this.notLiquidityEvent(instruction)
    );
  }

  private notLiquidityEvent(instruction: any): boolean {
    if (instruction.data) {
      const instructionType = base58.decode(instruction.data as string).slice(0, 8);
      const a = Object.values(DISCRIMINATORS.METEORA_DLMM)
        .flatMap((it) => Object.values(it))
        .some((it) => instructionType.equals(it));
      const b = Object.values(DISCRIMINATORS.METEORA_POOLS).some((it) => instructionType.equals(it));
      return !a && !b;
    }
    return true;
  }

  private processMeteoraSwaps(instructionIndex: number): TransferData[] {
    const innerInstructions = this.txWithMeta.meta?.innerInstructions;
    if (!innerInstructions) return [];

    return innerInstructions
      .filter((set) => set.index == instructionIndex)
      .flatMap((set) =>
        set.instructions
          .map((instruction, index) =>
            this.notLiquidityEvent(instruction)
              ? this.processTransferInstruction(instruction as ParsedInstruction, `${instructionIndex}-${index}`)
              : null
          )
          .filter((transfer): transfer is TransferData => transfer !== null)
      );
  }

  private processTransferInstruction(instruction: ParsedInstruction, idx: string): TransferData | null {
    if (isTransferCheck(instruction)) {
      return processTransferCheck(instruction, idx, this.splDecimalsMap);
    }
    if (isTransfer(instruction)) {
      return processTransfer(instruction, idx, this.splTokenMap, this.splDecimalsMap);
    }
    return null;
  }
}
