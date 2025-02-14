import { PublicKey } from "@solana/web3.js";

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
  type: "TRANSFER_IN" | "TRANSFER_OUT";
  token: TokenInfo;
  from: string;
  to: string;
  timestamp: number;
  signature: string;
}

export interface TransferData {
  type: "transfer" | "transferChecked";
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
}

export type TradeType = "BUY" | "SELL";

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
}

export interface PumpfunTradeEvent {
  mint: PublicKey;
  solAmount: bigint;
  tokenAmount: bigint;
  isBuy: boolean;
  user: PublicKey;
  timestamp: bigint;
  virtualSolReserves: bigint;
  virtualTokenReserves: bigint;
}

export interface PumpfunCreateEvent {
  name: string;
  symbol: string;
  uri: string;
  mint: PublicKey;
  bondingCurve: PublicKey;
  user: PublicKey;
}

export interface PumpfunCompleteEvent {
  user: PublicKey;
  mint: PublicKey;
  bondingCurve: PublicKey;
  timestamp: bigint;
}

export interface PumpfunEvent {
  type: "TRADE" | "CREATE" | "COMPLETE";
  data: PumpfunTradeEvent | PumpfunCreateEvent | PumpfunCompleteEvent;
  slot: number;
  timestamp: number;
  signature: string;
}

export const convertToUiAmount = (amount: bigint, decimals: number) => {
  return Number(amount) / Math.pow(10, decimals);
};
