export interface PumpfunTradeEvent {
  mint: string;
  solAmount: number | string;
  tokenAmount: number | string;
  isBuy: boolean;
  user: string;
  timestamp: bigint;
  virtualSolReserves: number | string;
  virtualTokenReserves: number | string;
}

export interface PumpfunCreateEvent {
  name: string;
  symbol: string;
  uri: string;
  mint: string;
  bondingCurve: string;
  user: string;
}

export interface PumpfunCompleteEvent {
  user: string;
  mint: string;
  bondingCurve: string;
  timestamp: bigint;
}

export interface PumpfunEvent {
  type: 'TRADE' | 'CREATE' | 'COMPLETE';
  data: PumpfunTradeEvent | PumpfunCreateEvent | PumpfunCompleteEvent;
  slot: number;
  timestamp: number;
  signature: string;
  idx: string; // instruction indexes
}
