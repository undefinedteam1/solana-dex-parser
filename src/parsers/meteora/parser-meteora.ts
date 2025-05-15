import { DEX_PROGRAMS, DISCRIMINATORS } from '../../constants';
import { TradeInfo } from '../../types';
import { getInstructionData, getProgramName } from '../../utils';
import { BaseParser } from '../base-parser';

export class MeteoraParser extends BaseParser {
  public processTrades(): TradeInfo[] {
    const trades: TradeInfo[] = [];

    this.classifiedInstructions.forEach(({ instruction, programId, outerIndex, innerIndex }) => {
      if (
        [DEX_PROGRAMS.METEORA.id, DEX_PROGRAMS.METEORA_POOLS.id, DEX_PROGRAMS.METEORA_DAMM.id].includes(programId) &&
        this.notLiquidityEvent(instruction)
      ) {
        const transfers = this.getTransfersForInstruction(programId, outerIndex, innerIndex);
        if (transfers.length >= 2) {
          const trade = this.utils.processSwapData(transfers, {
            ...this.dexInfo,
            amm: this.dexInfo.amm || getProgramName(programId),
          });
          if (trade) {
            trades.push(trade);
          }
        }
      }
    });

    return trades;
  }

  private notLiquidityEvent(instruction: any): boolean {
    const data = getInstructionData(instruction);
    if (!data) return true;

    const instructionType = data.slice(0, 8);

    const isDLMMLiquidity = Object.values(DISCRIMINATORS.METEORA_DLMM)
      .flatMap((it) => Object.values(it))
      .some((it) => instructionType.equals(it));

    const isPoolsLiquidity = Object.values(DISCRIMINATORS.METEORA_POOLS).some((it) => instructionType.equals(it));

    const isDAMMLiquidity = Object.values(DISCRIMINATORS.METEORA_DAMM).some((it) => instructionType.equals(it));

    return !isDLMMLiquidity && !isPoolsLiquidity && !isDAMMLiquidity;
  }
}
