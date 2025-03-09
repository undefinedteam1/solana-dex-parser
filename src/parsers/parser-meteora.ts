import { DEX_PROGRAMS, DISCRIMINATORS } from '../constants';
import { DexInfo, TradeInfo, TransferData } from '../types';
import { getInstructionData, getProgramName } from '../utils';
import { TransactionAdapter } from '../transaction-adapter';
import { TransactionUtils } from '../transaction-utils';

export class MeteoraParser {
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
    Object.entries(this.transferActions).forEach((it) => {
      trades.push(...this.parseTransferAction(it));
    });
    return trades;
  }

  public parseTransferAction(transfer: [string, TransferData[]]): TradeInfo[] {
    const trades: TradeInfo[] = [];
    const [programId, idxs] = transfer[0].split(':');
    const [outerIndex, innerIndex] = idxs.split('-');

    if (transfer[1].length >= 2 && [DEX_PROGRAMS.METEORA.id, DEX_PROGRAMS.METEORA_POOLS.id].includes(programId)) {
      const instruction = innerIndex
        ? this.adapter.getInnerInstruction(Number(outerIndex), Number(innerIndex))
        : this.adapter.instructions[Number(outerIndex)];

      if (this.notLiquidityEvent(instruction)) {
        const trade = this.utils.processSwapData(transfer[1], {
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
      const accounts = this.adapter.getInstructionAccounts(instruction);
      const curIdx = innerIndex === undefined ? outerIndex.toString() : `${outerIndex}-${innerIndex}`;
      const transfers = this.processMeteoraSwaps(outerIndex).filter(
        (it) => accounts.includes(it.info.destination) && it.idx >= curIdx
      );
      if (transfers.length > 0) {
        const trade = this.utils.processSwapData(transfers, this.dexInfo);
        if (trade) return [trade];
      }
      return [];
    } catch (error) {
      console.error('Error processing Meteora trades:', error);
      return [];
    }
  }

  public isTradeInstruction(instruction: any): boolean {
    const programId = this.adapter.getInstructionProgramId(instruction);
    return (
      [DEX_PROGRAMS.METEORA.id, DEX_PROGRAMS.METEORA_POOLS.id].includes(programId) &&
      this.notLiquidityEvent(instruction)
    );
  }

  private notLiquidityEvent(instruction: any): boolean {
    const data = getInstructionData(instruction);
    if (!data) return true;

    const instructionType = data.slice(0, 8);
    const isDLMMLiquidity = Object.values(DISCRIMINATORS.METEORA_DLMM)
      .flatMap((it) => Object.values(it))
      .some((it) => instructionType.equals(it));
    const isPoolsLiquidity = Object.values(DISCRIMINATORS.METEORA_POOLS).some((it) => instructionType.equals(it));

    return !isDLMMLiquidity && !isPoolsLiquidity;
  }

  private processMeteoraSwaps(instructionIndex: number): TransferData[] {
    const innerInstructions = this.adapter.innerInstructions;
    if (!innerInstructions) return [];

    return innerInstructions
      .filter((set) => set.index === instructionIndex)
      .flatMap((set) =>
        set.instructions
          .map((instruction, index) =>
            this.notLiquidityEvent(instruction)
              ? this.utils.parseInstructionAction(instruction, `${instructionIndex}-${index}`)
              : null
          )
          .filter((transfer): transfer is TransferData => transfer !== null)
      );
  }
}
