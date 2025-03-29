import { TransactionAdapter } from '../transaction-adapter';
import { TransactionUtils } from '../transaction-utils';
import { ClassifiedInstruction, PoolEvent, TransferData } from '../types';

export abstract class BaseLiquidityParser {
    protected readonly utils: TransactionUtils;

    constructor(
        protected readonly adapter: TransactionAdapter,
        protected readonly transferActions: Record<string, TransferData[]>,
        protected readonly classifiedInstructions: ClassifiedInstruction[]
    ) {
        this.utils = new TransactionUtils(adapter);
    }

    abstract processLiquidity(): PoolEvent[];

    protected getTransfersForInstruction(
        programId: string,
        outerIndex: number,
        innerIndex?: number,
        filterTypes?: string[]
    ): TransferData[] {
        const key = `${programId}:${outerIndex}${innerIndex == undefined ? '' : `-${innerIndex}`}`;
        const transfers = this.transferActions[key] || [];

        if (filterTypes) {
            return transfers.filter(t => filterTypes.includes(t.type));
        }
        return transfers;
    }
}