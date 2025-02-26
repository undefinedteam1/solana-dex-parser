export interface ParseConfig {
  /**
   * if true, will try to parse unknown DEXes
   * @default false
   */
  tryUnknowDEX?: boolean;

  /**
   * if set, will only parse transactions from these programIds
   * @default undefined
   */
  programIds?: string[];
}

export interface DexInfo {
  programId?: string;
  amm?: string;
}

export interface TokenInfo {
  mint: string;
  amount: number;
  decimals: number;
}

export interface TokenAmount {
  amount: bigint;
  uiAmount: number;
  decimals: number;
}

export interface TransferInfo {
  type: 'TRANSFER_IN' | 'TRANSFER_OUT';
  token: TokenInfo;
  from: string;
  to: string;
  timestamp: number;
  signature: string;
}

export interface TransferData {
  type: 'transfer' | 'transferChecked' | string;
  info: {
    authority: string;
    destination: string;
    mint: string;
    source: string;
    tokenAmount: {
      amount: string;
      decimals: number;
      uiAmount: number;
    };
  };
  idx: string;
}

export type TradeType = 'BUY' | 'SELL';

export interface TradeInfo {
  user: string;
  type: TradeType;
  inputToken: TokenInfo;
  outputToken: TokenInfo;
  fee?: TokenInfo;
  programId?: string; // DEX program ID
  amm?: string; // AMM type (e.g., 'Raydium v4', 'Jupiter')
  slot: number;
  timestamp: number;
  signature: string;
  idx: string; // instruction indexes
}

export interface PumpfunTradeEvent {
  mint: string;
  solAmount: number;
  tokenAmount: number;
  isBuy: boolean;
  user: string;
  timestamp: bigint;
  virtualSolReserves: number;
  virtualTokenReserves: number;
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

export type PoolEventType = 'CREATE' | 'ADD' | 'REMOVE';

export interface PoolEventBase {
  user: string;
  type: PoolEventType;
  programId?: string; // DEX program ID
  amm?: string; // AMM type (e.g., 'Raydiumv4', 'Jupiter')
  slot: number;
  timestamp: number;
  signature: string;
  idx: string; // instruction indexes
}
export interface PoolEvent extends PoolEventBase {
  /**
   * AMM pool address (market)
   */
  poolId: string;

  /**
   * LP mint address
   */
  poolLpMint?: string;

  /**
   * Token A mint address (TOKEN)
   */
  token0Mint?: string;

  /**
   * Token A amount (TOKEN)
   */
  token0Amount?: number;

  /**
   * Token B mint address (SOL/USDC/USDT)
   */
  token1Mint?: string;

  /**
   * Token B amount (SOL/USDC/USDT)
   */
  token1Amount?: number;

  /**
   * Lp amount
   */
  lpAmount?: number;
}

export const convertToUiAmount = (amount: bigint, decimals?: number) => {
  return Number(amount) / Math.pow(10, decimals || 9);
};
