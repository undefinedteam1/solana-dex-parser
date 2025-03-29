import { ParsedTransactionWithMeta, TransactionResponse, VersionedTransactionResponse } from '@solana/web3.js';

export type SolanaTransaction =
  | ParsedTransactionWithMeta
  | VersionedTransactionResponse
  | (TransactionResponse & VersionedTransactionResponse);

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
  route?: string;
}

export interface TokenInfo {
  mint: string;
  amount: number;
  decimals: number;
  authority?: string;
  destination?: string;
  source?: string;
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
  programId: string;
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
  user: string; // Signer Address (Who Buy or Sell)
  type: TradeType;
  inputToken: TokenInfo;
  outputToken: TokenInfo;
  fee?: TokenInfo;
  programId?: string; // DEX program ID
  amm?: string; // AMM type (e.g., 'RaydiumV4', 'Meteora')
  route?: string; // Router or Bot (e.g., 'Jupiter','OKX','BananaGun')
  slot: number;
  timestamp: number;
  signature: string;
  idx: string; // instruction indexes
}

export const convertToUiAmount = (amount: bigint, decimals?: number) => {
  return Number(amount) / Math.pow(10, decimals || 9);
};
