import { deserializeUnchecked } from 'borsh';
import { DEX_PROGRAMS, DISCRIMINATORS } from '../../constants';
import { JupiterSwapEventData, JupiterSwapInfo, TradeInfo } from '../../types';
import { getAMMs, getInstructionData, getProgramName, getTradeType } from '../../utils';
import { BaseParser } from '../base-parser';
import { JupiterLayout } from './layout';

export class JupiterParser extends BaseParser {
  public processTrades(): TradeInfo[] {
    const trades: TradeInfo[] = [];

    this.classifiedInstructions.forEach(({ instruction, programId, outerIndex, innerIndex }) => {
      if (this.isJupiterRouteEventInstruction(instruction)) {
        const event = this.parseJupiterRouteEventInstruction(
          instruction,
          `${outerIndex}-${innerIndex ?? 0}`
        );
        if (event) {
          const data = this.processSwapData([event]);
          if (data) {
            trades.push(data);
          }
        }
      }
    });

    return trades;
  }

  private isJupiterRouteEventInstruction(instruction: any): boolean {
    const programId = this.adapter.getInstructionProgramId(instruction);
    if (programId !== DEX_PROGRAMS.JUPITER.id) return false;

    const data = getInstructionData(instruction);
    if (!data || data.length < 16) return false;

    return Buffer.from(data.slice(0, 16)).equals(Buffer.from(DISCRIMINATORS.JUPITER.ROUTE_EVENT));
  }

  private parseJupiterRouteEventInstruction(instruction: any, idx: string): JupiterSwapEventData | null {
    try {
      const data = getInstructionData(instruction);
      if (!data || data.length < 16) return null;

      const eventData = data.slice(16);
      const layout = deserializeUnchecked(JupiterLayout.schema, JupiterLayout, Buffer.from(eventData));
      const swapEvent = layout.toSwapEvent();

      return {
        ...swapEvent,
        inputMintDecimals: this.adapter.getTokenDecimals(swapEvent.inputMint.toBase58()) || 0,
        outputMintDecimals: this.adapter.getTokenDecimals(swapEvent.outputMint.toBase58()) || 0,
        idx,
      };
    } catch (error) {
      console.error('Parse Jupiter route event error:', error);
      return null;
    }
  }

  private processSwapData(events: JupiterSwapEventData[]): TradeInfo | null {
    if (events.length === 0) return null;

    const intermediateInfo = this.buildIntermediateInfo(events);
    return this.convertToTradeInfo(intermediateInfo);
  }

  private buildIntermediateInfo(events: JupiterSwapEventData[]): JupiterSwapInfo {
    const info: JupiterSwapInfo = {
      amms: [],
      tokenIn: new Map(),
      tokenOut: new Map(),
      decimals: new Map(),
      idx: '',
    };

    for (const event of events) {
      const inputMint = event.inputMint.toBase58();
      const outputMint = event.outputMint.toBase58();

      info.tokenIn.set(inputMint, (info.tokenIn.get(inputMint) || BigInt(0)) + event.inputAmount);
      info.tokenOut.set(outputMint, (info.tokenOut.get(outputMint) || BigInt(0)) + event.outputAmount);
      info.decimals.set(inputMint, event.inputMintDecimals);
      info.decimals.set(outputMint, event.outputMintDecimals);
      info.idx = event.idx;
      info.amms.push(getProgramName(event.amm.toBase58()));
    }

    this.removeIntermediateTokens(info);
    return info;
  }

  private removeIntermediateTokens(info: JupiterSwapInfo): void {
    for (const [mint, inAmount] of info.tokenIn.entries()) {
      const outAmount = info.tokenOut.get(mint);
      if (outAmount && inAmount === outAmount) {
        info.tokenIn.delete(mint);
        info.tokenOut.delete(mint);
      }
    }
  }

  private convertToTradeInfo(info: JupiterSwapInfo): TradeInfo | null {
    if (info.tokenIn.size !== 1 || info.tokenOut.size !== 1) return null;

    const [[inMint, inAmount]] = Array.from(info.tokenIn.entries());
    const [[outMint, outAmount]] = Array.from(info.tokenOut.entries());
    const inDecimals = info.decimals.get(inMint) || 0;
    const outDecimals = info.decimals.get(outMint) || 0;

    const signerIndex = this.containsDCAProgram() ? 2 : 0;
    const signer = this.adapter.getAccountKey(signerIndex);

    const trade = {
      type: getTradeType(inMint, outMint),
      inputToken: {
        mint: inMint,
        amount: Number(inAmount) / 10 ** inDecimals,
        decimals: inDecimals,
      },
      outputToken: {
        mint: outMint,
        amount: Number(outAmount) / 10 ** outDecimals,
        decimals: outDecimals,
      },
      user: signer,
      programId: this.dexInfo.programId,
      amm: info.amms?.[0] || this.dexInfo.amm || '',
      route: this.dexInfo.route || '',
      slot: this.adapter.slot,
      timestamp: this.adapter.blockTime,
      signature: this.adapter.signature,
      idx: info.idx,
    };

    return this.utils.attachTokenTransferInfo(trade, this.transferActions);
  }

  private containsDCAProgram(): boolean {
    return this.adapter.accountKeys.some((key) => key === DEX_PROGRAMS.JUPITER_DCA.id);
  }
}