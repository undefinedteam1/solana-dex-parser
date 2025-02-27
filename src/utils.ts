import { ParsedTransactionWithMeta } from '@solana/web3.js';
import { SYSTEM_PROGRAMS, DEX_PROGRAMS, TOKENS } from './constants';
import { DexInfo, PoolEventType } from './types';

/**
 * Get the name of a program by its ID
 * @param programId - The program ID to look up
 * @returns The name of the program or 'Unknown' if not found
 */
export const getProgramName = (programId: string): string =>
  Object.values(DEX_PROGRAMS).find((dex) => dex.id === programId)?.name || 'Unknown';

/**
 * Extract DEX information from a transaction
 * @param tx - The parsed transaction with metadata
 * @returns Information about the DEX used in the transaction
 */
export const getDexInfo = (tx: ParsedTransactionWithMeta): DexInfo => {
  const instructions = tx.transaction.message.instructions;
  let mainProgramId: string | undefined;

  for (const ix of instructions) {
    if (!('programId' in ix)) continue;

    const programId = ix.programId.toString();
    if (SYSTEM_PROGRAMS.includes(programId)) continue;
    if ('parsed' in ix && ix.parsed?.type === 'createIdempotent') continue;

    if (programId === DEX_PROGRAMS.JUPITER.id) {
      return {
        programId: DEX_PROGRAMS.JUPITER.id,
        amm: DEX_PROGRAMS.JUPITER.name,
      };
    }

    if (!mainProgramId) {
      mainProgramId = programId;
    }

    const dexProgram = Object.values(DEX_PROGRAMS).find((dex) => dex.id === programId);

    if (dexProgram) {
      return {
        programId: dexProgram.id,
        amm: dexProgram.name,
      };
    }
  }

  return mainProgramId ? { programId: mainProgramId } : {};
};

/**
 * Get pre and post token balance changes from a transaction
 * @param tx - The parsed transaction with metadata
 * @returns Object containing pre and post balances
 */
export const getBalanceChanges = (tx: ParsedTransactionWithMeta) => ({
  preBalances: mapBalances(tx.meta?.preTokenBalances || []),
  postBalances: mapBalances(tx.meta?.postTokenBalances || []),
});

/**
 * Map token balances to a structured object by owner and mint
 * @param balances - Array of token balances
 * @returns Mapped object of balances by owner and mint
 */
export const mapBalances = (
  balances: NonNullable<ParsedTransactionWithMeta['meta']>['preTokenBalances']
): Record<string, Record<string, number>> => {
  const mapped: Record<string, Record<string, number>> = {};

  balances?.forEach((balance) => {
    if (balance.owner && balance.mint) {
      mapped[balance.owner] = mapped[balance.owner] || {};
      mapped[balance.owner][balance.mint] = Number(balance.uiTokenAmount?.uiAmount || 0);
    }
  });

  return mapped;
};

/**
 * Get token decimals from a transaction
 * @param tx - The parsed transaction with metadata
 * @param mint - The token mint address
 * @returns Number of decimals for the token (defaults to 9)
 */
export const getTokenDecimals = (tx: ParsedTransactionWithMeta, mint: string): number =>
  tx.meta?.preTokenBalances?.find((b) => b.mint === mint)?.uiTokenAmount?.decimals || 9;

/**
 * Check if a token mint is in the supported tokens list
 * @param mint - The token mint address
 * @returns Boolean indicating if the token is supported
 */
export const isSupportedToken = (mint: string): boolean => Object.values(TOKENS).includes(mint);

/**
 * Create base pool event data
 * @param type - Type of pool event
 * @param tx - The parsed transaction with metadata
 * @param programId - The program ID associated with the event
 * @returns Base pool event object
 */
export const getPoolEventBase = (type: PoolEventType, tx: ParsedTransactionWithMeta, programId: string) => ({
  user: tx.transaction.message.accountKeys[0].pubkey.toBase58(),
  type,
  programId,
  amm: getProgramName(programId),
  slot: tx.slot,
  timestamp: tx.blockTime!,
  signature: tx.transaction.signatures[0],
});

/**
 * Convert a hex string to Uint8Array
 * @param hex - Hex string to convert
 * @returns Uint8Array representation of the hex string
 */
export const hexToUint8Array = (hex: string): Uint8Array =>
  new Uint8Array(hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));

export const notSystemProgram = (instruction: any): boolean => {
  return !SYSTEM_PROGRAMS.includes(instruction.programId.toBase58());
};
