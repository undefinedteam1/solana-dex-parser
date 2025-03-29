import { TransactionAdapter } from '../transaction-adapter';
import { TransactionUtils } from '../transaction-utils';
import { ClassifiedInstruction, DexInfo, TradeInfo, TransferData } from '../types';

export abstract class BaseParser {
  protected readonly utils: TransactionUtils;

  constructor(
    protected readonly adapter: TransactionAdapter,
    protected readonly dexInfo: DexInfo,
    protected readonly transferActions: Record<string, TransferData[]>,
    protected readonly classifiedInstructions: ClassifiedInstruction[]
  ) {
    this.utils = new TransactionUtils(adapter);
  }

  abstract processTrades(): TradeInfo[];

  protected getTransfersForInstruction(programId: string, outerIndex: number, innerIndex?: number): TransferData[] {
    const key = `${programId}:${outerIndex}${innerIndex == undefined ? '' : `-${innerIndex}`}`;
    const transfers = this.transferActions[key] || [];
    return transfers.filter(t => ["transfer", "transferChecked"].includes(t.type));
  }
}