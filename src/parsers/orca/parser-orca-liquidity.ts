import { DEX_PROGRAMS, DISCRIMINATORS } from '../../constants';
import { PoolEvent, PoolEventType, TransferData } from '../../types';
import { getInstructionData } from '../../utils';
import { BaseLiquidityParser } from '../base-liquidity-parser';

export class OrcaLiquidityParser extends BaseLiquidityParser {
  public processLiquidity(): PoolEvent[] {
    const events: PoolEvent[] = [];

    this.classifiedInstructions
      .filter(({ programId }) => programId === DEX_PROGRAMS.ORCA.id)
      .forEach(({ instruction, programId, outerIndex, innerIndex }) => {
        const event = this.parseInstruction(instruction, programId, outerIndex, innerIndex);
        if (event) {
          events.push(event);
        }
      });

    return events;
  }

  private parseInstruction(
    instruction: any,
    programId: string,
    outerIndex: number,
    innerIndex?: number
  ): PoolEvent | null {
    try {
      const data = getInstructionData(instruction);
      const action = this.getPoolAction(data);
      if (!action) return null;

      const transfers = this.getTransfersForInstruction(programId, outerIndex, innerIndex);

      switch (action) {
        case 'ADD':
          return this.parseAddLiquidityEvent(instruction, outerIndex, data, transfers);
        case 'REMOVE':
          return this.parseRemoveLiquidityEvent(instruction, outerIndex, data, transfers);
      }
      return null;
    } catch (error) {
      console.error('parseInstruction error:', error);
      return null;
    }
  }

  private getPoolAction(data: Buffer): PoolEventType | null {
    const instructionType = data.slice(0, 8);
    if (
      instructionType.equals(DISCRIMINATORS.ORCA.ADD_LIQUIDITY) ||
      instructionType.equals(DISCRIMINATORS.ORCA.ADD_LIQUIDITY2)
    ) {
      return 'ADD';
    } else if (instructionType.equals(DISCRIMINATORS.ORCA.REMOVE_LIQUIDITY)) {
      return 'REMOVE';
    }
    return null;
  }

  private parseAddLiquidityEvent(instruction: any, index: number, data: any, transfers: TransferData[]): PoolEvent {
    const [token0, token1] = this.utils.getLPTransfers(transfers);
    const token0Mint = token0?.info.mint;
    const token1Mint = token1?.info.mint;
    const programId = this.adapter.getInstructionProgramId(instruction);
    const accounts = this.adapter.getInstructionAccounts(instruction);
    const [token0Decimals, token1Decimals] = [
      this.adapter.getTokenDecimals(token0Mint),
      this.adapter.getTokenDecimals(token1Mint),
    ];

    return {
      ...this.adapter.getPoolEventBase('ADD', programId),
      idx: index.toString(),
      poolId: accounts[0],
      poolLpMint: accounts[0],
      token0Mint: token0Mint,
      token1Mint: token1Mint,
      token0Amount: this.adapter.getFormatAmount(
        token0?.info.tokenAmount.amount || data.readBigUInt64LE(32),
        token0?.info.tokenAmount.uiAmount,
        token0Decimals
      ),
      token1Amount: this.adapter.getFormatAmount(
        token1?.info.tokenAmount.amount || data.readBigUInt64LE(24),
        token1?.info.tokenAmount.uiAmount,
        token1Decimals
      ),
      token0Decimals: token0Decimals,
      token1Decimals: token1Decimals,
      lpAmount: this.adapter.getFormatAmount(data.readBigUInt64LE(8), 0, this.adapter.getTokenDecimals(accounts[1])),
    };
  }

  private parseRemoveLiquidityEvent(instruction: any, index: number, data: any, transfers: TransferData[]): PoolEvent {
    const [token0, token1] = this.utils.getLPTransfers(transfers);
    const token0Mint = token0?.info.mint;
    const token1Mint = token1?.info.mint;
    const programId = this.adapter.getInstructionProgramId(instruction);
    const accounts = this.adapter.getInstructionAccounts(instruction);
    const [token0Decimals, token1Decimals] = [
      this.adapter.getTokenDecimals(token0Mint),
      this.adapter.getTokenDecimals(token1Mint),
    ];

    return {
      ...this.adapter.getPoolEventBase('REMOVE', programId),
      idx: index.toString(),
      poolId: accounts[0],
      poolLpMint: accounts[0],
      token0Mint: token0Mint,
      token1Mint: token1Mint,
      token0Amount: this.adapter.getFormatAmount(
        token0?.info.tokenAmount.amount || data.readBigUInt64LE(32),
        token0?.info.tokenAmount.uiAmount,
        token0Decimals
      ),
      token1Amount: this.adapter.getFormatAmount(
        token1?.info.tokenAmount.amount || data.readBigUInt64LE(24),
        token1?.info.tokenAmount.uiAmount,
        token1Decimals
      ),
      token0Decimals: token0Decimals,
      token1Decimals: token1Decimals,
      lpAmount: this.adapter.getFormatAmount(
        data.readBigUInt64LE(8),
        undefined,
        this.adapter.getTokenDecimals(accounts[1])
      ),
    };
  }
}
