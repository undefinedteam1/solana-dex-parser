export interface BoopfunTradeEvent {
  mint: string;
  solAmount: bigint;
  tokenAmount: bigint;
  isBuy: boolean;
  user: string;
  bondingCurve: string;
}

export interface BoopfunCreateEvent {
  name: string;
  symbol: string;
  uri: string;
  mint: string;
  // bondingCurve: string;
  user: string;
}

export interface BoopfunCompleteEvent {
  user: string;
  mint: string;
  bondingCurve: string;
  solAmount: bigint; // sol amount to Raydium
  feeAmount: bigint; // fee amount to Boopfun
}

export interface BoopfunEvent {
  type: 'BUY' | 'SELL' | 'CREATE' | 'COMPLETE';
  data: BoopfunTradeEvent | BoopfunCreateEvent | BoopfunCompleteEvent;
  slot: number;
  timestamp: number;
  signature: string;
  idx: string; // instruction indexes
}
