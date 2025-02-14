import { ParsedInstruction, ParsedTransactionWithMeta } from "@solana/web3.js";
import { DEX_PROGRAMS } from "../constants";
import { DexInfo, TokenInfo, TradeInfo, TransferData } from "../types";
import { TokenInfoExtractor } from "../token-extractor";
import {
  isTransfer,
  isTransferCheck,
  processSwapData,
  processTransfer,
  processTransferCheck,
} from "../transfer-utils";

export class MeteoraParser {
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
        if (this.isMeteoraInstruction(instruction)) {
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
      const transfers = this.processMeteoraSwaps(instructionIndex);
      return transfers.length
        ? [processSwapData(this.txWithMeta, transfers, this.dexInfo)]
        : [];
    } catch (error) {
      console.error("Error processing Meteora trades:", error);
      return [];
    }
  }

  private isMeteoraInstruction(instruction: any): boolean {
    const programId = instruction.programId.toBase58();
    return [DEX_PROGRAMS.METEORA.id, DEX_PROGRAMS.METEORA_POOLS.id].includes(
      programId,
    );
  }

  private processMeteoraSwaps(instructionIndex: number): TransferData[] {
    const innerInstructions = this.txWithMeta.meta?.innerInstructions;
    if (!innerInstructions) return [];

    return innerInstructions
      .filter((set) => set.index === instructionIndex)
      .flatMap((set) =>
        set.instructions
          .map((instruction) =>
            this.processTransferInstruction(instruction as ParsedInstruction),
          )
          .filter((transfer): transfer is TransferData => transfer !== null),
      );
  }

  private processTransferInstruction(
    instruction: ParsedInstruction,
  ): TransferData | null {
    if (isTransferCheck(instruction)) {
      return processTransferCheck(instruction, this.splDecimalsMap);
    }
    if (isTransfer(instruction)) {
      return processTransfer(
        instruction,
        this.splTokenMap,
        this.splDecimalsMap,
      );
    }
    return null;
  }
}
