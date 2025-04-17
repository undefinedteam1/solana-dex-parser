import base58 from 'bs58';
import { DEX_PROGRAMS, TOKENS } from './constants';
import { DexInfo, TradeInfo, TradeType } from './types';
import { PublicKey } from '@solana/web3.js';

/**
 * Get instruction data
 */
export const getInstructionData = (instruction: any): Buffer => {
  if ('data' in instruction) {
    if (typeof instruction.data === 'string') return Buffer.from(base58.decode(instruction.data)); // compatible with both bs58 v4.0.1 and v6.0.0
    if (instruction.data instanceof Uint8Array) return Buffer.from(instruction.data);
  }
  return instruction.data;
};

/**
 * Get the name of a program by its ID
 * @param programId - The program ID to look up
 * @returns The name of the program or 'Unknown' if not found
 */
export const getProgramName = (programId: string): string =>
  Object.values(DEX_PROGRAMS).find((dex) => dex.id === programId)?.name || 'Unknown';

/**
 * Convert a hex string to Uint8Array
 * @param hex - Hex string to convert
 * @returns Uint8Array representation of the hex string
 */
export const hexToUint8Array = (hex: string): Uint8Array =>
  new Uint8Array(hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));

export const absBigInt = (value: bigint): bigint => {
  return value < 0n ? -value : value;
};

export const getTradeType = (inMint: string, outMint: string): TradeType => {
  if (inMint == TOKENS.SOL) return 'BUY';
  if (outMint == TOKENS.SOL) return 'SELL';
  if (Object.values(TOKENS).includes(inMint)) return 'BUY';
  return 'SELL';
};

export const getAMMs = (transferActionKeys: string[]) => {
  const amms = Object.values(DEX_PROGRAMS).filter((it) => it.tags.includes('amm'));
  return transferActionKeys
    .map((it) => {
      const item = Object.values(amms).find((amm) => it.split(':')[0] == amm.id);
      if (item) return item.name;
      return null;
    })
    .filter((it) => it != null);
};

export const getTranferTokenMint = (token1?: string, token2?: string): string | undefined => {
  if (token1 == token2) return token1;
  if (token1 && token1 != TOKENS.SOL) return token1;
  if (token2 && token2 != TOKENS.SOL) return token2;
  return token1 || token2;
};

export const getPubkeyString = (value: any): string => {
  if (typeof value === 'string') return value;
  if (value instanceof PublicKey) return value.toBase58();
  return value;
};

export const getFinalSwap = (trades: TradeInfo[], dexInfo?: DexInfo): TradeInfo | null => {
  if (trades.length == 1) return trades[0];
  if (trades.length >= 2) {
    const inputTrade = trades[0];
    const outputTrade = trades[trades.length - 1];

    return {
      type: getTradeType(inputTrade.inputToken.mint, outputTrade.outputToken.mint),
      inputToken: inputTrade.inputToken,
      outputToken: outputTrade.outputToken,
      user: inputTrade.user,
      programId: inputTrade.programId,
      amm: dexInfo?.amm || inputTrade.amm,
      route: dexInfo?.route || inputTrade.route || '',
      slot: inputTrade.slot,
      timestamp: inputTrade.timestamp,
      signature: inputTrade.signature,
      idx: inputTrade.idx,
    } as TradeInfo;
  }
  return null;
};
