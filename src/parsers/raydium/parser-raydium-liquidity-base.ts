import { TOKENS } from '../../constants';
import { PoolEvent, PoolEventType, TransferData, convertToUiAmount } from '../../types';
import { getInstructionData } from '../../utils';
import { BaseLiquidityParser } from '../base-liquidity-parser';

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

export abstract class RaydiumLiquidityParserBase extends BaseLiquidityParser {
  abstract getPoolAction(data: Buffer): PoolEventType | { name: string; type: PoolEventType } | null;

  abstract getEventConfig(
    type: PoolEventType,
    instructionType: PoolEventType | { name: string; type: PoolEventType }
  ): ParseEventConfig | null;

  public processLiquidity(): PoolEvent[] {
    const events: PoolEvent[] = [];

    this.classifiedInstructions.forEach(({ instruction, programId, outerIndex, innerIndex }) => {
      const event = this.parseRaydiumInstruction(instruction, programId, outerIndex, innerIndex);
      if (event) {
        events.push(event);
      }
    });

    return events;
  }

  protected parseRaydiumInstruction(
    instruction: any,
    programId: string,
    outerIndex: number,
    innerIndex?: number
  ): PoolEvent | null {
    try {
      const data = getInstructionData(instruction);
      const instructionType = this.getPoolAction(data);
      if (!instructionType) return null;

      const accounts = this.adapter.getInstructionAccounts(instruction);
      const type = typeof instructionType === 'string' ? instructionType : instructionType.type;
      const transfers = this.getTransfersForInstruction(programId, outerIndex, innerIndex).filter(
        (it) => it.info.authority && accounts.includes(it.info.destination) && it.programId != TOKENS.NATIVE
      );

      const config = this.getEventConfig(type, instructionType);

      if (!config) return null;
      return this.parseEvent(instruction, outerIndex, data, transfers, config);
    } catch (error) {
      console.error('parseRaydiumInstruction error:', error);
      return null;
    }
  }

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
      this.adapter.getTokenDecimals(token1Mint),
    ];

    const token0Amount =
      token0?.info.tokenAmount.uiAmount ||
      (config.tokenAmountOffsets &&
        convertToUiAmount(data.readBigUInt64LE(config.tokenAmountOffsets.token0), token0Decimals)) ||
      0;

    const token1Amount =
      token1?.info.tokenAmount.uiAmount ||
      (config.tokenAmountOffsets &&
        convertToUiAmount(data.readBigUInt64LE(config.tokenAmountOffsets.token1), token1Decimals)) ||
      0;

    const lpAmount =
      lpToken?.info.tokenAmount.uiAmount ||
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
}
