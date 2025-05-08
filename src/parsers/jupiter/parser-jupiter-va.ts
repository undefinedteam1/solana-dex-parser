import { deserializeUnchecked } from 'borsh';
import { DEX_PROGRAMS, DISCRIMINATORS, TOKENS } from '../../constants';
import { convertToUiAmount, TradeInfo, TradeType, TransferData } from '../../types';
import { getAMMs, getInstructionData, getTradeType } from '../../utils';
import { BaseParser } from '../base-parser';
import { JupiterVAFillLayout, JupiterVAWithdrawLayout } from './layouts/jupiter-va.layout';

export class JupiterVAParser extends BaseParser {
  public processTrades(): TradeInfo[] {
    const trades: TradeInfo[] = [];

    this.classifiedInstructions.forEach(({ instruction, programId, outerIndex, innerIndex }) => {
      if (programId == DEX_PROGRAMS.JUPITER_VA.id) {
        const data = getInstructionData(instruction);
        const discriminator = Buffer.from(data.slice(0, 16));
        if (discriminator.equals(DISCRIMINATORS.JUPITER_VA.FILL_EVENT)) {
          trades.push(this.parseFullFilled(instruction, `${outerIndex}-${innerIndex ?? 0}`));
        }
      }
    });

    return trades;
  }

  private parseFullFilled(instruction: any, idx: string): TradeInfo {
    const eventData = getInstructionData(instruction).slice(16);
    const layout = deserializeUnchecked(JupiterVAFillLayout.schema, JupiterVAFillLayout, Buffer.from(eventData));
    const event = layout.toObject();

    const tradeType: TradeType = getTradeType(event.inputMint, event.outputMint);

    const [inputDecimal, outputDecimal] = [
      this.adapter.splDecimalsMap.get(event.inputMint),
      this.adapter.splDecimalsMap.get(event.outputMint),
    ];

    const trade = {
      type: tradeType,
      inputToken: {
        mint: event.inputMint,
        amount: convertToUiAmount(event.inputAmount, inputDecimal),
        amountRaw: event.inputAmount.toString(),
        decimals: inputDecimal ?? 0,
      },
      outputToken: {
        mint: event.outputMint,
        amount: convertToUiAmount(event.outputAmount, outputDecimal),
        amountRaw: event.outputAmount.toString(),
        decimals: outputDecimal ?? 0,
      },
      fee: {
        mint: event.outputMint,
        amount: convertToUiAmount(event.fee, outputDecimal),
        amountRaw: event.fee.toString(),
        decimals: outputDecimal ?? 0,
      },
      user: event.user,
      programId: DEX_PROGRAMS.JUPITER_VA.id,
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
    return amms.length > 0 ? amms[0] : this.dexInfo?.amm || DEX_PROGRAMS.JUPITER_VA.name;
  }

  public processTransfers(): TransferData[] {
    const transfers: TransferData[] = [];
    this.classifiedInstructions.forEach(({ instruction, programId, outerIndex, innerIndex }) => {
      if (programId == DEX_PROGRAMS.JUPITER_VA.id) {
        const data = getInstructionData(instruction);
        const discriminator = Buffer.from(data.slice(0, 16));

        if (discriminator.equals(DISCRIMINATORS.JUPITER_VA.WITHDRAW_EVENT)) {
          transfers.push(...this.parseWithdraw(data, programId, outerIndex, `${outerIndex}-${innerIndex ?? 0}`));
        }
      }
    });
    return transfers;
  }

  private parseWithdraw(data: any, programId: string, outerIndex: number, idx: string): TransferData[] {
    // find outer instruction
    const eventInstruction = this.adapter.instructions[outerIndex];
    if (!eventInstruction) {
      throw new Error('Event instruction not found');
    }
    // parse event data
    const eventData = data.slice(16);
    const event = JupiterVAWithdrawLayout.deserialize(eventData).toObject();

    // get outer instruction accounts
    const accounts = this.adapter.getInstructionAccounts(eventInstruction);
    const user = accounts[1];
    const source = accounts[8];

    const balance =
      event.mint == TOKENS.SOL
        ? this.adapter.getAccountSolBalanceChanges().get(user)
        : this.adapter.getAccountTokenBalanceChanges().get(user)?.get(event.mint);

    if (!balance) return [];

    const decimals = this.adapter.getTokenDecimals(event.mint);
    return [
      {
        type: 'Withdraw',
        programId: programId,
        info: {
          authority: this.adapter.getTokenAccountOwner(source),
          source: source,
          destination: user,
          destinationOwner: this.adapter.getTokenAccountOwner(user),
          mint: event.mint,
          tokenAmount: {
            amount: event.amount.toString(),
            uiAmount: convertToUiAmount(event.amount, decimals),
            decimals: decimals,
          },
          sourceBalance: balance.post,
          sourcePreBalance: balance.pre,
        },
        idx: idx,
        timestamp: this.adapter.blockTime,
        signature: this.adapter.signature,
      },
    ];
  }
}
