import { ParsedInstruction, ParsedTransactionWithMeta } from '@solana/web3.js';
import { DEX_PROGRAMS, DISCRIMINATORS } from '../constants';
import { DexInfo, TokenInfo, TradeInfo, TransferData } from '../types';
import { TokenInfoExtractor } from '../token-extractor';
import { processSwapData, isTransfer, processTransfer } from '../transfer-utils';
import base58 from 'bs58';

export class OrcaParser {
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
          const instructionTrades = this.processInstructionTrades(instruction, index);
          trades.push(...instructionTrades);
        }
        return trades;
      },
      []
    );
  }

  public processInstructionTrades(instruction: any, outerIndex: number, innerIndex?: number): TradeInfo[] {
    try {
      const accounts = instruction.accounts?.map((it: { toBase58: () => any; }) => it.toBase58());
      const curIdx = innerIndex === undefined ? outerIndex.toString() : `${outerIndex}-${innerIndex}`;
      const transfers = this.processOrcaSwaps(outerIndex).filter((it) => accounts.includes(it.info.destination) && it.idx >= curIdx).slice(0, 2);
      if (transfers.length > 0) {
        const trade = processSwapData(this.txWithMeta, transfers, this.dexInfo);
        if (trade) return [trade];
      }
      return [];
    } catch (error) {
      console.error('Error processing Orca trades:', error);
      return [];
    }
  }

  public isTradeInstruction(instruction: any): boolean {
    const programId = instruction.programId.toBase58();
    return DEX_PROGRAMS.ORCA.id == programId && this.notLiquidityEvent(instruction);
  }

  private notLiquidityEvent(instruction: any): boolean {
    if (instruction.data) {
      const instructionType = base58.decode(instruction.data as string).slice(0, 8);
      return !Object.values(DISCRIMINATORS.ORCA).some((it) => instructionType.equals(it));
    }
    return true;
  }

  private processOrcaSwaps(instructionIndex: number): TransferData[] {
    const innerInstructions = this.txWithMeta.meta?.innerInstructions;
    if (!innerInstructions) return [];

    return innerInstructions
      .filter((set) => set.index === instructionIndex)
      .flatMap((set) =>
        set.instructions
          .map((instruction, index) => {
            return this.notLiquidityEvent(instruction)
              ? this.processTransferInstruction(instruction as ParsedInstruction, `${instructionIndex}-${index}`)
              : null;
          })
          .filter((transfer): transfer is TransferData => transfer !== null)
      );
  }

  private processTransferInstruction(instruction: ParsedInstruction, idx: string): TransferData | null {
    if (isTransfer(instruction)) {
      return processTransfer(instruction, idx, this.splTokenMap, this.splDecimalsMap);
    }
    return null;
  }
}
