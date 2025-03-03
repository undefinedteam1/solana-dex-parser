import { ParsedInstruction, ParsedTransactionWithMeta } from '@solana/web3.js';
import { DEX_PROGRAMS, DISCRIMINATORS } from '../constants';
import { DexInfo, TokenInfo, TradeInfo, TransferData } from '../types';
import { isTransfer, isTransferCheck, processSwapData, processTransfer, processTransferCheck } from '../transfer-utils';
import base58 from 'bs58';
import { getProgramName } from '../utils';

export class MeteoraParser {
  constructor(
    private readonly txWithMeta: ParsedTransactionWithMeta,
    private readonly dexInfo: DexInfo,
    private readonly splTokenMap: Map<string, TokenInfo>,
    private readonly splDecimalsMap: Map<string, number>,
    private readonly transferActions: Record<string, TransferData[]>
  ) {}

  public processTrades(): TradeInfo[] {
    const trades: TradeInfo[] = [];
    Object.entries(this.transferActions).forEach((it) => {
      if (it[1].length >= 2) {
      }
    });
    return trades;
  }

  public parseTransferAction(transfer: [string, TransferData[]]): TradeInfo[] {
    const trades: TradeInfo[] = [];
    const [programId, idxs] = transfer[0].split(':');
    const [outerIndex, innerIndex] = idxs.split('-');

    if ([DEX_PROGRAMS.METEORA.id, DEX_PROGRAMS.METEORA_POOLS.id].includes(programId)) {
      const instruction = innerIndex
        ? this.txWithMeta.meta?.innerInstructions?.find((it) => it.index == Number(outerIndex))?.instructions[
            Number(innerIndex)
          ]
        : this.txWithMeta.transaction.message.instructions[Number(outerIndex)];
      if (this.notLiquidityEvent(instruction)) {
        const trade = processSwapData(this.txWithMeta, transfer[1], {
          ...this.dexInfo,
          amm: this.dexInfo.amm || getProgramName(programId),
        });
        if (trade) {
          trades.push(trade);
        }
      }
    }
    return trades;
  }

  public processInstructionTrades(instruction: any, outerIndex: number, innerIndex?: number): TradeInfo[] {
    try {
      const accounts = instruction.accounts?.map((it: { toBase58: () => any }) => it.toBase58());
      const curIdx = innerIndex === undefined ? outerIndex.toString() : `${outerIndex}-${innerIndex}`;
      const transfers = this.processMeteoraSwaps(outerIndex).filter(
        (it) => accounts.includes(it.info.destination) && it.idx >= curIdx
      );
      if (transfers.length > 0) {
        const trade = processSwapData(this.txWithMeta, transfers, this.dexInfo);
        if (trade) return [trade];
      }
      return [];
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
