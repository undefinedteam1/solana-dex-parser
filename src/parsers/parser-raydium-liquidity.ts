import { DEX_PROGRAMS, DISCRIMINATORS } from '../constants';
import { TransactionAdapter } from '../transaction-adapter';
import { TransactionUtils } from '../transaction-utils';
import { PoolEvent, PoolEventType } from '../types';
import { ParseEventConfig, RaydiumLiquidityParserBase } from './parser-raydium-liquidity-base';

export class RaydiumLiquidityParser {
    private readonly utils: TransactionUtils;
    constructor(private readonly adapter: TransactionAdapter) {
        this.utils = new TransactionUtils(adapter);
    }

    public processLiquidity(): PoolEvent[] {
        const events = this.adapter.instructions
            .map((instr: any, idx: number) => this.processInstruction(instr, idx))
            .filter((event: any): event is PoolEvent => event !== null);

        return events.length > 0 ? events : this.processInnerInstructions();
    }

    private processInnerInstructions(): PoolEvent[] {
        try {
            return this.adapter.instructions.flatMap((_: any, idx: number) => this.processInnerInstruction(idx));
        } catch (error) {
            console.error('Error processing Raydium inner instructions:', error);
            return [];
        }
    }

    private processInnerInstruction(outerIndex: number): PoolEvent[] {
        return (this.adapter.innerInstructions || [])
            .filter((set) => set.index === outerIndex)
            .flatMap((set) =>
                set.instructions
                    .map((instr, innerIdx) => this.processInstruction(instr, outerIndex, innerIdx))
                    .filter((event): event is PoolEvent => event !== null)
            );
    }

    private processInstruction(instruction: any, outerIndex: number, innerIndex?: number): PoolEvent | null {
        const programId = this.adapter.getInstructionProgramId(instruction);
        const parsers = {
            [DEX_PROGRAMS.RAYDIUM_V4.id]: RaydiumV4PoolParser,
            [DEX_PROGRAMS.RAYDIUM_CL.id]: RaydiumCLPoolParser,
            [DEX_PROGRAMS.RAYDIUM_CPMM.id]: RaydiumCPMMPoolParser,
        };

        const ParserClass = parsers[programId];
        if (!ParserClass) return null;

        return new ParserClass(this.adapter, this.utils).parseRaydiumInstruction(instruction, outerIndex, innerIndex);
    }
}

class RaydiumV4PoolParser extends RaydiumLiquidityParserBase {
    public getPoolAction(data: Buffer): PoolEventType | null {
        const instructionType = data.slice(0, 1);
        if (instructionType.equals(DISCRIMINATORS.RAYDIUM.CREATE)) return 'CREATE';
        if (instructionType.equals(DISCRIMINATORS.RAYDIUM.ADD_LIQUIDITY)) return 'ADD';
        if (instructionType.equals(DISCRIMINATORS.RAYDIUM.REMOVE_LIQUIDITY)) return 'REMOVE';
        return null;
    }

    protected getEventConfig(type: PoolEventType): ParseEventConfig {
        const configs = {
            CREATE: { eventType: 'CREATE' as const, poolIdIndex: 4, lpMintIndex: 7 },
            ADD: { eventType: 'ADD' as const, poolIdIndex: 1, lpMintIndex: 5 },
            REMOVE: { eventType: 'REMOVE' as const, poolIdIndex: 1, lpMintIndex: 5 }
        };
        return configs[type];
    }
}

class RaydiumCLPoolParser extends RaydiumLiquidityParserBase {
    public getPoolAction(data: Buffer): { name: string; type: PoolEventType } | null {
        const instructionType = data.slice(0, 8);

        for (const [name, discriminator] of Object.entries(DISCRIMINATORS.RAYDIUM_CL.CREATE)) {
            if (instructionType.equals(discriminator)) return { name, type: 'CREATE' };
        }

        for (const [name, discriminator] of Object.entries(DISCRIMINATORS.RAYDIUM_CL.ADD_LIQUIDITY)) {
            if (instructionType.equals(discriminator)) return { name, type: 'ADD' };
        }

        for (const [name, discriminator] of Object.entries(DISCRIMINATORS.RAYDIUM_CL.REMOVE_LIQUIDITY)) {
            if (instructionType.equals(discriminator)) return { name, type: 'REMOVE' };
        }

        return null;
    }

    protected getEventConfig(
        type: PoolEventType,
        instructionType: { name: string; type: PoolEventType }
    ): ParseEventConfig {
        const configs = {
            CREATE: {
                eventType: 'CREATE' as const,
                poolIdIndex: ['openPosition', 'openPositionV2'].includes(instructionType.name) ? 5 : 4,
                lpMintIndex: ['openPosition', 'openPositionV2'].includes(instructionType.name) ? 5 : 4
            },
            ADD: {
                eventType: 'ADD' as const,
                poolIdIndex: 2,
                lpMintIndex: 2,
                tokenAmountOffsets: { token0: 32, token1: 24, lp: 8 }
            },
            REMOVE: {
                eventType: 'REMOVE' as const,
                poolIdIndex: 3,
                lpMintIndex: 3,
                tokenAmountOffsets: { token0: 32, token1: 24, lp: 8 }
            }
        };
        return configs[type];
    }
}

class RaydiumCPMMPoolParser extends RaydiumLiquidityParserBase {
    public getPoolAction(data: Buffer): PoolEventType | null {
        const instructionType = data.slice(0, 8);
        if (instructionType.equals(DISCRIMINATORS.RAYDIUM_CPMM.CREATE)) return 'CREATE';
        if (instructionType.equals(DISCRIMINATORS.RAYDIUM_CPMM.ADD_LIQUIDITY)) return 'ADD';
        if (instructionType.equals(DISCRIMINATORS.RAYDIUM_CPMM.REMOVE_LIQUIDITY)) return 'REMOVE';
        return null;
    }

    protected getEventConfig(type: PoolEventType): ParseEventConfig {
        const configs = {
            CREATE: {
                eventType: 'CREATE' as const,
                poolIdIndex: 3,
                lpMintIndex: 6,
                tokenAmountOffsets: { token0: 8, token1: 16, lp: 0 }
            },
            ADD: {
                eventType: 'ADD' as const,
                poolIdIndex: 2,
                lpMintIndex: 12,
                tokenAmountOffsets: { token0: 16, token1: 24, lp: 8 }
            },
            REMOVE: {
                eventType: 'REMOVE' as const,
                poolIdIndex: 2,
                lpMintIndex: 12,
                tokenAmountOffsets: { token0: 16, token1: 24, lp: 8 }
            }
        };
        return configs[type];
    }
}