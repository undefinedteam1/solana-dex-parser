import { deserializeUnchecked } from 'borsh';
import { DEX_PROGRAMS, DISCRIMINATORS } from '../../constants';
import { convertToUiAmount, TradeInfo, TradeType } from '../../types';
import { getAMMs, getInstructionData, getTradeType } from '../../utils';
import { BaseParser } from '../base-parser';
import { JupiterLimitOrderV2TradeLayout } from './layouts/jupiter-limit.layout';

export class JupiterLimitOrderV2Parser extends BaseParser {
  public processTrades(): TradeInfo[] {
    const trades: TradeInfo[] = [];

    this.classifiedInstructions.forEach(({ instruction, programId, outerIndex, innerIndex }) => {
      if (programId == DEX_PROGRAMS.JUPITER_LIMIT_ORDER_V2.id) {
        const data = getInstructionData(instruction);
        const discriminator = Buffer.from(data.slice(0, 16));
        if (discriminator.equals(DISCRIMINATORS.JUPITER_LIMIT_ORDER_V2.TRADE_EVENT)) {
          trades.push(this.parseFlashFilled(data, outerIndex, `${outerIndex}-${innerIndex ?? 0}`));
        }
      }
    });

    return trades;
  }

  private parseFlashFilled(data: any, outerIndex: number, idx: string): TradeInfo {
    // find outer instruction
    const eventInstruction = this.adapter.instructions[outerIndex];
    if (!eventInstruction) {
      throw new Error('Event instruction not found');
    }

    // parse event data
    const eventData = data.slice(16);
    const layout = deserializeUnchecked(
      JupiterLimitOrderV2TradeLayout.schema,
      JupiterLimitOrderV2TradeLayout,
      Buffer.from(eventData)
    );
    const event = layout.toObject();

    // get outer instruction accounts
    const accounts = this.adapter.getInstructionAccounts(eventInstruction);
    const [inputToken, outputToken] = [
      this.adapter.splTokenMap.get(accounts[3]),
      this.adapter.splTokenMap.get(accounts[5]),
    ];

    if (!inputToken || !outputToken) {
      throw new Error('inputToken or outputToken not found');
    }
    const [inputMint, inputDecimal, outputMint, outputDecimal] = [
      inputToken.mint,
      inputToken.decimals,
      outputToken.mint,
      outputToken.decimals,
    ];
    // Jupiter fee 0.1%
    const feeAmount = BigInt(event.takingAmount) / 1000n;
    const outAmount = BigInt(event.takingAmount) - BigInt(feeAmount);
    const tradeType: TradeType = getTradeType(inputMint, outputMint);
    const trade = {
      type: tradeType,
      inputToken: {
        mint: inputMint,
        amount: convertToUiAmount(event.makingAmount, inputDecimal),
        amountRaw: event.makingAmount.toString(),
        decimals: inputDecimal ?? 0,
      },
      outputToken: {
        mint: outputMint,
        amount: convertToUiAmount(outAmount, outputDecimal),
        amountRaw: outAmount.toString(),
        decimals: outputDecimal ?? 0,
      },
      fee: {
        mint: outputMint,
        amount: convertToUiAmount(feeAmount, outputDecimal),
        amountRaw: feeAmount.toString(),
        decimals: outputDecimal ?? 0,
      },
      user: event.taker,
      programId: DEX_PROGRAMS.JUPITER_LIMIT_ORDER_V2.id,
      amm: this.getAmm(),
      route: this.dexInfo?.route || '',
      slot: this.adapter.slot,
      timestamp: this.adapter.blockTime || 0,
      signature: this.adapter.signature,
      idx: idx || '',
    };

    return this.utils.attachTokenTransferInfo(trade, this.transferActions);
  }

  private getAmm(): string {
    const amms = getAMMs(Object.keys(this.transferActions));
    return amms.length > 0 ? amms[0] : this.dexInfo?.amm || DEX_PROGRAMS.JUPITER_LIMIT_ORDER_V2.name;
  }
}
