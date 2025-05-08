import { DEX_PROGRAMS, TOKENS } from '../../constants';
import {
  DexInfo,
  PumpfunTradeEvent,
  PumpswapBuyEvent,
  PumpswapSellEvent,
  TradeInfo,
  TradeType,
  convertToUiAmount,
} from '../../types';
import { getTradeType } from '../../utils';

export const getPumpfunTradeInfo = (
  event: PumpfunTradeEvent,
  info: {
    slot: number;
    signature: string;
    timestamp: number;
    idx?: string;
    dexInfo?: DexInfo;
  }
): TradeInfo => {
  const tradeType: TradeType = event.isBuy ? 'BUY' : 'SELL';
  const isBuy = tradeType === 'BUY';
  return {
    type: tradeType,
    inputToken: {
      mint: isBuy ? TOKENS.SOL : event.mint,
      amount: isBuy ? convertToUiAmount(event.solAmount) : convertToUiAmount(event.tokenAmount, 6),
      amountRaw: isBuy ? event.solAmount.toString() : event.tokenAmount.toString(),
      decimals: isBuy ? 9 : 6,
    },
    outputToken: {
      mint: isBuy ? event.mint : TOKENS.SOL,
      amount: isBuy ? convertToUiAmount(event.tokenAmount, 6) : convertToUiAmount(event.solAmount),
      amountRaw: isBuy ? event.tokenAmount.toString() : event.solAmount.toString(),
      decimals: isBuy ? 6 : 9,
    },
    user: event.user,
    programId: DEX_PROGRAMS.PUMP_FUN.id,
    amm: info.dexInfo?.amm || DEX_PROGRAMS.PUMP_FUN.name,
    route: info.dexInfo?.route || '',
    slot: info.slot,
    timestamp: info.timestamp,
    signature: info.signature,
    idx: info.idx || '',
  };
};

export const getPumpswapBuyInfo = (
  event: PumpswapBuyEvent,
  inputToken: {
    mint: string;
    decimals: number;
  },
  outputToken: {
    mint: string;
    decimals: number;
  },
  info: {
    slot: number;
    signature: string;
    timestamp: number;
    idx?: string;
    dexInfo?: DexInfo;
  }
): TradeInfo => {
  const { mint: inputMint, decimals: inputDecimal } = inputToken;
  const { mint: outputMint, decimals: ouptDecimal } = outputToken;

  return {
    type: getTradeType(inputMint, outputMint),
    inputToken: {
      mint: inputMint,
      amount: convertToUiAmount(event.quoteAmountInWithLpFee, inputDecimal),
      amountRaw: event.quoteAmountInWithLpFee.toString(),
      decimals: inputDecimal,
    },
    outputToken: {
      mint: outputMint,
      amount: convertToUiAmount(event.baseAmountOut, ouptDecimal),
      amountRaw: event.baseAmountOut.toString(),
      decimals: ouptDecimal,
    },
    fee: {
      mint: inputMint,
      amount: convertToUiAmount(event.protocolFee, inputDecimal),
      amountRaw: event.protocolFee.toString(),
      decimals: inputDecimal,
    },
    user: event.user,
    programId: info.dexInfo?.programId || DEX_PROGRAMS.PUMP_SWAP.id,
    amm: DEX_PROGRAMS.PUMP_SWAP.name,
    route: info.dexInfo?.route || '',
    slot: info.slot,
    timestamp: info.timestamp,
    signature: info.signature,
    idx: info.idx || '',
  };
};

export const getPumpswapSellInfo = (
  event: PumpswapSellEvent,
  inputToken: {
    mint: string;
    decimals: number;
  },
  outputToken: {
    mint: string;
    decimals: number;
  },
  info: {
    slot: number;
    signature: string;
    timestamp: number;
    idx?: string;
    dexInfo?: DexInfo;
  }
): TradeInfo => {
  const { mint: inputMint, decimals: inputDecimal } = inputToken;
  const { mint: outputMint, decimals: ouptDecimal } = outputToken;
  return {
    type: getTradeType(inputMint, outputMint),
    inputToken: {
      mint: inputMint,
      amount: convertToUiAmount(event.baseAmountIn, inputDecimal),
      amountRaw: event.baseAmountIn.toString(),
      decimals: inputDecimal,
    },
    outputToken: {
      mint: outputMint,
      amount: convertToUiAmount(event.userQuoteAmountOut, ouptDecimal),
      amountRaw: event.userQuoteAmountOut.toString(),
      decimals: ouptDecimal,
    },
    fee: {
      mint: outputMint,
      amount: convertToUiAmount(event.protocolFee, ouptDecimal),
      amountRaw: event.protocolFee.toString(),
      decimals: ouptDecimal,
    },
    user: event.user,
    programId: info.dexInfo?.programId || DEX_PROGRAMS.PUMP_SWAP.id,
    amm: DEX_PROGRAMS.PUMP_SWAP.name,
    route: info.dexInfo?.route || '',
    slot: info.slot,
    timestamp: info.timestamp,
    signature: info.signature,
    idx: info.idx || '',
  };
};
