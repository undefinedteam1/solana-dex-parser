import { ParsedInstruction, ParsedTransactionWithMeta } from "@solana/web3.js";
import { DEX_PROGRAMS } from "../constants";
import { DexInfo, TokenInfo, TradeInfo, TransferData } from "../types";
import { TokenInfoExtractor } from "../token-extractor";
import {
  processSwapData,
  isTransfer,
  processTransfer,
} from "../transfer-utils";

export class OrcaParser {
  private readonly splTokenMap: Map<string, TokenInfo>;
  private readonly splDecimalsMap: Map<string, number>;

  constructor(
    private readonly txWithMeta: ParsedTransactionWithMeta,
    private readonly dexInfo: DexInfo,
  ) {
    const tokenExtractor = new TokenInfoExtractor(txWithMeta);
    this.splTokenMap = tokenExtractor.extractSPLTokenInfo();
    this.splDecimalsMap = tokenExtractor.extractDecimals();
  }

  public processTrades(): TradeInfo[] {
    return this.txWithMeta.transaction.message.instructions.reduce(
      (trades: TradeInfo[], instruction: any, index: number) => {
        if (this.isOrcaInstruction(instruction)) {
          const instructionTrades = this.processInstructionTrades(index);
          trades.push(...instructionTrades);
        }
        return trades;
      },
      [],
    );
  }

  public processInstructionTrades(instructionIndex: number): TradeInfo[] {
    try {
      const transfers = this.processOrcaSwaps(instructionIndex);
      return transfers.length
        ? [processSwapData(this.txWithMeta, transfers, this.dexInfo)]
        : [];
    } catch (error) {
      console.error("Error processing Orca trades:", error);
      return [];
    }
  }

  private isOrcaInstruction(instruction: any): boolean {
    const programId = instruction.programId.toBase58();
    return DEX_PROGRAMS.ORCA.id == programId;
  }

  private processOrcaSwaps(instructionIndex: number): TransferData[] {
    const innerInstructions = this.txWithMeta.meta?.innerInstructions;
    if (!innerInstructions) return [];

    return innerInstructions
      .filter((set) => set.index === instructionIndex)
      .flatMap((set) =>
        set.instructions
          .map((instruction, index) =>
            this.processTransferInstruction(
              instruction as ParsedInstruction,
              `${instructionIndex}-${index}`,
            ),
          )
          .filter((transfer): transfer is TransferData => transfer !== null),
      );
  }

  private processTransferInstruction(
    instruction: ParsedInstruction,
    idx: string,
  ): TransferData | null {
    if (isTransfer(instruction)) {
      return processTransfer(
        instruction,
        idx,
        this.splTokenMap,
        this.splDecimalsMap,
      );
    }
    return null;
  }
}
