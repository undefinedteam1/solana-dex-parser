import { convertToUiAmount, PoolEvent, PoolEventType, TransferData } from '../types';
import { TransactionAdapter } from '../transaction-adapter';
import { TransactionUtils } from '../transaction-utils';
import { getInstructionData } from '../utils';

export interface ParseEventConfig {
    eventType: PoolEventType;
    poolIdIndex: number;
    lpMintIndex: number;
    tokenAmountOffsets?: {
        token0: number;
        token1: number;
        lp: number;
    };
}

export abstract class RaydiumLiquidityParserBase {

    constructor(protected readonly adapter: TransactionAdapter,
        private readonly utils: TransactionUtils
    ) {
    }

    abstract getPoolAction(data: Buffer): PoolEventType | { name: string; type: PoolEventType } | null;

    public parseRaydiumInstruction(instruction: any, index: number, innerIndex?: number): PoolEvent | null {
        try {
            const data = getInstructionData(instruction);
            const instructionType = this.getPoolAction(data);
            if (!instructionType) return null;

            const type = typeof instructionType === 'string' ? instructionType : instructionType.type;
            const transfers = this.getTransfersForInstruction(instruction, index, innerIndex);
            const config = this.getEventConfig(type, instructionType);

            if (!config) return null;
            return this.parseEvent(instruction, index, data, transfers, config);
        } catch (error) {
            console.error('parseRaydiumInstruction error:', error);
            return null;
        }
    }

    protected abstract getEventConfig(
        type: PoolEventType,
        instructionType: PoolEventType | { name: string; type: PoolEventType }
    ): ParseEventConfig | null;

    protected parseEvent(
        instruction: any,
        index: number,
        data: Buffer,
        transfers: TransferData[],
        config: ParseEventConfig
    ): PoolEvent | null {
        if (config.eventType === 'ADD' && transfers.length < 2) return null;

        const [token0, token1] = this.utils.getLPTransfers(transfers);
        const lpToken = transfers.find((it) => it.type === (config.eventType === 'REMOVE' ? 'burn' : 'mintTo'));
        const programId = this.adapter.getInstructionProgramId(instruction);
        const accounts = this.adapter.getInstructionAccounts(instruction);

        const token0Mint = token0?.info.mint;
        const token1Mint = token1?.info.mint;
        const [token0Decimals, token1Decimals] = [
            this.adapter.getTokenDecimals(token0Mint),
            this.adapter.getTokenDecimals(token1Mint)
        ];

        const token0Amount = token0?.info.tokenAmount.uiAmount ||
            (config.tokenAmountOffsets && convertToUiAmount(data.readBigUInt64LE(config.tokenAmountOffsets.token0), token0Decimals)) ||
            0;

        const token1Amount = token1?.info.tokenAmount.uiAmount ||
            (config.tokenAmountOffsets && convertToUiAmount(data.readBigUInt64LE(config.tokenAmountOffsets.token1), token1Decimals)) ||
            0;

        const lpAmount = lpToken?.info.tokenAmount.uiAmount ||
            (config.tokenAmountOffsets && convertToUiAmount(data.readBigUInt64LE(config.tokenAmountOffsets.lp))) ||
            0;

        return {
            ...this.adapter.getPoolEventBase(config.eventType, programId),
            idx: index.toString(),
            poolId: accounts[config.poolIdIndex],
            poolLpMint: lpToken?.info.mint || accounts[config.lpMintIndex],
            token0Mint,
            token1Mint,
            token0Amount,
            token1Amount,
            token0Decimals,
            token1Decimals,
            lpAmount,
        };
    }

    protected getTransfersForInstruction(
        instruction: any,
        index: number,
        innerIndex?: number,
        filterTypes: string[] = ['mintTo', 'burn']
    ): TransferData[] {
        const curIdx = innerIndex === undefined ? index.toString() : `${index}-${innerIndex}`;
        const accounts = this.adapter.getInstructionAccounts(instruction);

        return this.utils
            .processTransferInstructions(index, filterTypes)
            .filter((it) =>
                it.info.authority.length > 0 &&
                accounts.includes(it.info.destination) &&
                it.idx >= curIdx
            );
    }
}