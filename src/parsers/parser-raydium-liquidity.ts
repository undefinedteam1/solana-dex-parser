import { DEX_PROGRAMS, DISCRIMINATORS } from '../constants';
import { convertToUiAmount, PoolEvent, PoolEventType, TransferData } from '../types';
import { TransactionAdapter } from '../transaction-adapter';
import { TransactionUtils } from '../transaction-utils';
import { getInstructionData } from '../utils';

export class RaydiumLiquidityParser {
  private readonly utils: TransactionUtils;
  constructor(private readonly adapter: TransactionAdapter) {
    this.utils = new TransactionUtils(adapter);
  }

  // Process top-level instructions and fallback to inner instructions
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

class RaydiumV4PoolParser {
  constructor(
    private readonly adapter: TransactionAdapter,
    private readonly utils: TransactionUtils
  ) {}

  public getPoolAction(data: any): PoolEventType | null {
    const instructionType = data.slice(0, 1);
    if (instructionType.equals(DISCRIMINATORS.RAYDIUM.CREATE)) return 'CREATE';
    if (instructionType.equals(DISCRIMINATORS.RAYDIUM.ADD_LIQUIDITY)) return 'ADD';
    if (instructionType.equals(DISCRIMINATORS.RAYDIUM.REMOVE_LIQUIDITY)) return 'REMOVE';
    return null;
  }

  public parseRaydiumInstruction(instruction: any, index: number, innerIndex?: number): PoolEvent | null {
    try {
      const data = getInstructionData(instruction);
      const instructionType = this.getPoolAction(data);
      if (!instructionType) return null;

      const curIdx = innerIndex === undefined ? index.toString() : `${index}-${innerIndex}`;
      const accounts = this.adapter.getInstructionAccounts(instruction);
      const transfers = this.utils
        .processTransferInstructions(index, ['mintTo', 'burn'])
        .filter((it) => it.info.authority.length > 0 && accounts.includes(it.info.destination) && it.idx >= curIdx);

      const handlers = {
        CREATE: () => this.parseCreateEvent(instruction, index, data, transfers),
        ADD: () => this.parseAddLiquidityEvent(instruction, index, data, transfers),
        REMOVE: () => this.parseRemoveLiquidityEvent(instruction, index, data, transfers),
      };

      return handlers[instructionType]();
    } catch (error) {
      console.error('parseRaydiumInstruction error:', error);
      return null;
    }
  }

  private parseCreateEvent(instruction: any, index: number, data: any, transfers: TransferData[]): PoolEvent {
    const [token0, token1] = this.utils.getLPTransfers(transfers);
    const lpToken = transfers.find((it) => it.type === 'mintTo');
    const programId = this.adapter.getInstructionProgramId(instruction);
    const accounts = this.adapter.getInstructionAccounts(instruction);
    return {
      ...this.adapter.getPoolEventBase('CREATE', programId),
      idx: index.toString(),
      poolId: accounts[4],
      poolLpMint: lpToken?.info.mint || accounts[7],
      token0Mint: token0?.info.mint,
      token1Mint: token1?.info.mint,
      token0Amount: token0?.info.tokenAmount.uiAmount || 0,
      token1Amount: token1?.info.tokenAmount.uiAmount || 0,
      lpAmount: lpToken?.info.tokenAmount.uiAmount || 0,
    };
  }

  private parseAddLiquidityEvent(instruction: any, index: number, data: any, transfers: TransferData[]): PoolEvent {
    const [token0, token1] = this.utils.getLPTransfers(transfers);
    const lpToken = transfers.find((it) => it.type === 'mintTo');
    const programId = this.adapter.getInstructionProgramId(instruction);
    const accounts = this.adapter.getInstructionAccounts(instruction);
    return {
      ...this.adapter.getPoolEventBase('ADD', programId),
      idx: index.toString(),
      poolId: accounts[1],
      poolLpMint: lpToken?.info.mint || accounts[5],
      token0Mint: token0?.info.mint,
      token1Mint: token1?.info.mint,
      token0Amount: token0?.info.tokenAmount.uiAmount || 0,
      token1Amount: token1?.info.tokenAmount.uiAmount || 0,
      lpAmount: lpToken?.info.tokenAmount.uiAmount || 0,
    };
  }

  private parseRemoveLiquidityEvent(instruction: any, index: number, data: any, transfers: TransferData[]): PoolEvent {
    const [token0, token1] = this.utils.getLPTransfers(transfers);
    const lpToken = transfers.find((it) => it.type === 'burn');
    const programId = this.adapter.getInstructionProgramId(instruction);
    const accounts = this.adapter.getInstructionAccounts(instruction);
    return {
      ...this.adapter.getPoolEventBase('REMOVE', programId),
      idx: index.toString(),
      poolId: accounts[1],
      poolLpMint: lpToken?.info.mint || accounts[5],
      token0Mint: token0?.info.mint,
      token1Mint: token1?.info.mint,
      token0Amount: token0?.info.tokenAmount.uiAmount || 0,
      token1Amount: token1?.info.tokenAmount.uiAmount || 0,
      lpAmount: lpToken?.info.tokenAmount.uiAmount || 0,
    };
  }
}

class RaydiumCLPoolParser {
  constructor(
    private readonly adapter: TransactionAdapter,
    private readonly utils: TransactionUtils
  ) {}

  public getPoolAction(data: any): { name: string; type: PoolEventType } | null {
    const instructionType = data.slice(0, 8);

    // Check if it's a CREATE operation
    for (const [name, discriminator] of Object.entries(DISCRIMINATORS.RAYDIUM_CL.CREATE)) {
      if (instructionType.equals(discriminator)) {
        return { name, type: 'CREATE' };
      }
    }

    // Check if it's an ADD operation
    for (const [name, discriminator] of Object.entries(DISCRIMINATORS.RAYDIUM_CL.ADD_LIQUIDITY)) {
      if (instructionType.equals(discriminator)) {
        return { name, type: 'ADD' };
      }
    }

    // Check if it's a REMOVE operation
    for (const [name, discriminator] of Object.entries(DISCRIMINATORS.RAYDIUM_CL.REMOVE_LIQUIDITY)) {
      if (instructionType.equals(discriminator)) {
        return { name, type: 'REMOVE' };
      }
    }

    return null;
  }

  public parseRaydiumInstruction(instruction: any, index: number, innerIndex?: number): PoolEvent | null {
    try {
      const data = getInstructionData(instruction);
      const instructionType = this.getPoolAction(data);
      if (!instructionType) return null;

      const curIdx = innerIndex === undefined ? index.toString() : `${index}-${innerIndex}`;
      const accounts = this.adapter.getInstructionAccounts(instruction);
      const transfers = this.utils
        .processTransferInstructions(index)
        .filter((it) => accounts.includes(it.info.destination) && it.idx >= curIdx);

      const handlers = {
        CREATE: () => {
          const poolAccountIdx = ['openPosition', 'openPositionV2'].includes(instructionType.name) ? 5 : 4;
          return this.parseCreateEvent(instruction, index, data, transfers, poolAccountIdx);
        },
        ADD: () => this.parseAddLiquidityEvent(instruction, index, data, transfers),
        REMOVE: () => this.parseRemoveLiquidityEvent(instruction, index, data, transfers),
      };

      return handlers[instructionType.type]();
    } catch (error) {
      console.error('parseRaydiumInstruction error:', error);
      return null;
    }
  }

  private parseCreateEvent(
    instruction: any,
    index: number,
    data: any,
    transfers: TransferData[],
    poolAccountIdx: number
  ): PoolEvent {
    const [token0, token1] = this.utils.getLPTransfers(transfers);
    const token0Mint = token0?.info.mint;
    const token1Mint = token1?.info.mint;
    const programId = this.adapter.getInstructionProgramId(instruction);
    const accounts = this.adapter.getInstructionAccounts(instruction);
    return {
      ...this.adapter.getPoolEventBase('CREATE', programId),
      idx: index.toString(),
      poolId: accounts[poolAccountIdx],
      poolLpMint: accounts[poolAccountIdx],
      token0Mint,
      token1Mint,
      token0Amount: token0?.info.tokenAmount.uiAmount || 0,
      token1Amount: token1?.info.tokenAmount.uiAmount || 0,
      lpAmount: 0,
    };
  }

  private parseAddLiquidityEvent(
    instruction: any,
    index: number,
    data: any,
    transfers: TransferData[]
  ): PoolEvent | null {
    if (transfers.length < 2) return null;
    const accounts = this.adapter.getInstructionAccounts(instruction);
    const [token0, token1] = this.utils.getLPTransfers(transfers);
    const token0Mint = token0?.info.mint || accounts[13];
    const token1Mint = token1?.info.mint || accounts[14];
    const programId = this.adapter.getInstructionProgramId(instruction);

    return {
      ...this.adapter.getPoolEventBase('ADD', programId),
      idx: index.toString(),
      poolId: accounts[2],
      poolLpMint: accounts[2],
      token0Mint,
      token1Mint,
      token0Amount:
        token0?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(32), this.adapter.getTokenDecimals(token0Mint)),
      token1Amount:
        token1?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(24), this.adapter.getTokenDecimals(token1Mint)),
      lpAmount: convertToUiAmount(data.readBigUInt64LE(8)) || 0,
    };
  }

  private parseRemoveLiquidityEvent(instruction: any, index: number, data: any, transfers: TransferData[]): PoolEvent {
    const [token0, token1] = this.utils.getLPTransfers(transfers);
    const token0Mint = token0?.info.mint;
    const token1Mint = token1?.info.mint;
    const programId = this.adapter.getInstructionProgramId(instruction);
    const accounts = this.adapter.getInstructionAccounts(instruction);
    return {
      ...this.adapter.getPoolEventBase('REMOVE', programId),
      idx: index.toString(),
      poolId: accounts[3],
      poolLpMint: accounts[3],
      token0Mint,
      token1Mint,
      token0Amount:
        token0?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(32), this.adapter.getTokenDecimals(token0Mint)),
      token1Amount:
        token1?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(24), this.adapter.getTokenDecimals(token1Mint)),
      lpAmount: convertToUiAmount(data.readBigUInt64LE(8).toString()),
    };
  }
}

class RaydiumCPMMPoolParser {
  constructor(
    private readonly adapter: TransactionAdapter,
    private readonly utils: TransactionUtils
  ) {}

  public getPoolAction(data: any): PoolEventType | null {
    const instructionType = data.slice(0, 8);
    if (instructionType.equals(DISCRIMINATORS.RAYDIUM_CPMM.CREATE)) return 'CREATE';
    if (instructionType.equals(DISCRIMINATORS.RAYDIUM_CPMM.ADD_LIQUIDITY)) return 'ADD';
    if (instructionType.equals(DISCRIMINATORS.RAYDIUM_CPMM.REMOVE_LIQUIDITY)) return 'REMOVE';
    return null;
  }

  public parseRaydiumInstruction(instruction: any, index: number, innerIndex?: number): PoolEvent | null {
    try {
      const data = getInstructionData(instruction);
      const instructionType = this.getPoolAction(data);
      if (!instructionType) return null;

      const curIdx = innerIndex === undefined ? index.toString() : `${index}-${innerIndex}`;
      const accounts = this.adapter.getInstructionAccounts(instruction);
      const transfers = this.utils
        .processTransferInstructions(index, ['mintTo', 'burn'])
        .filter((it) => it.info.authority.length > 0 && accounts.includes(it.info.destination) && it.idx >= curIdx);

      const handlers = {
        CREATE: () => this.parseCreateEvent(instruction, index, data, transfers),
        ADD: () => this.parseAddLiquidityEvent(instruction, index, data, transfers),
        REMOVE: () => this.parseRemoveLiquidityEvent(instruction, index, data, transfers),
      };

      return handlers[instructionType]();
    } catch (error) {
      console.error('parseRaydiumInstruction error:', error);
      return null;
    }
  }

  private parseCreateEvent(instruction: any, index: number, data: any, transfers: TransferData[]): PoolEvent {
    const [token0, token1] = this.utils.getLPTransfers(transfers);
    const lpToken = transfers.find((it) => it.type === 'mintTo');
    const programId = this.adapter.getInstructionProgramId(instruction);
    const accounts = this.adapter.getInstructionAccounts(instruction);
    return {
      ...this.adapter.getPoolEventBase('CREATE', programId),
      idx: index.toString(),
      poolId: accounts[3],
      poolLpMint: lpToken?.info.mint || accounts[6],
      token0Mint: token0?.info.mint,
      token1Mint: token1?.info.mint,
      token0Amount:
        token0?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(8), this.adapter.getTokenDecimals(token0?.info.mint)),
      token1Amount:
        token1?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(16), this.adapter.getTokenDecimals(token1?.info.mint)),
      lpAmount: lpToken?.info.tokenAmount.uiAmount || 0,
    };
  }

  private parseAddLiquidityEvent(
    instruction: any,
    index: number,
    data: any,
    transfers: TransferData[]
  ): PoolEvent | null {
    if (transfers.length < 2) return null;

    const [token0, token1] = this.utils.getLPTransfers(transfers);
    const lpToken = transfers.find((it) => it.type === 'mintTo');
    const programId = this.adapter.getInstructionProgramId(instruction);
    const accounts = this.adapter.getInstructionAccounts(instruction);
    return {
      ...this.adapter.getPoolEventBase('ADD', programId),
      idx: index.toString(),
      poolId: accounts[2],
      poolLpMint: accounts[12],
      token0Mint: token0?.info.mint,
      token1Mint: token1?.info.mint,
      token0Amount:
        token0?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(16), this.adapter.getTokenDecimals(token0?.info.mint)),
      token1Amount:
        token1?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(24), this.adapter.getTokenDecimals(token1?.info.mint)),
      lpAmount: lpToken?.info.tokenAmount.uiAmount || convertToUiAmount(data.readBigUInt64LE(8)),
    };
  }

  private parseRemoveLiquidityEvent(instruction: any, index: number, data: any, transfers: TransferData[]): PoolEvent {
    const [token0, token1] = this.utils.getLPTransfers(transfers);
    const lpToken = transfers.find((it) => it.type === 'burn');
    const programId = this.adapter.getInstructionProgramId(instruction);
    const accounts = this.adapter.getInstructionAccounts(instruction);
    return {
      ...this.adapter.getPoolEventBase('REMOVE', programId),
      idx: index.toString(),
      poolId: accounts[2],
      poolLpMint: accounts[12],
      token0Mint: token0?.info.mint,
      token1Mint: token1?.info.mint,
      token0Amount:
        token0?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(16), this.adapter.getTokenDecimals(token0?.info.mint)),
      token1Amount:
        token1?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(24), this.adapter.getTokenDecimals(token1?.info.mint)),
      lpAmount: lpToken?.info.tokenAmount.uiAmount || convertToUiAmount(data.readBigUInt64LE(8).toString()),
    };
  }
}
