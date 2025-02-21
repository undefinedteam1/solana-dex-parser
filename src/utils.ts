import { ParsedTransactionWithMeta } from "@solana/web3.js";
import { SYSTEM_PROGRAMS, DEX_PROGRAMS, TOKENS } from "./constants";
import { DexInfo, PoolEventType } from "./types";

export const getProgramName = (programId: string): string => {
  const dexProgram = Object.values(DEX_PROGRAMS).find(
    (dex) => dex.id === programId,
  );
  return dexProgram ? dexProgram.name : "Unknown";
};

export const getDexInfo = (tx: ParsedTransactionWithMeta): DexInfo => {
  const instructions = tx.transaction.message.instructions;
  let mainProgramId: string | undefined;

  for (const ix of instructions) {
    if (!("programId" in ix)) continue;

    const programId = ix.programId.toString();
    if (SYSTEM_PROGRAMS.includes(programId)) continue;
    if ("parsed" in ix && ix.parsed?.type === "createIdempotent") continue;

    if (programId === DEX_PROGRAMS.JUPITER.id) {
      return {
        programId: DEX_PROGRAMS.JUPITER.id,
        amm: DEX_PROGRAMS.JUPITER.name,
      };
    }

    if (!mainProgramId) {
      mainProgramId = programId;
    }

    const dexProgram = Object.values(DEX_PROGRAMS).find(
      (dex) => dex.id === programId,
    );

    if (dexProgram) {
      return {
        programId: dexProgram.id,
        amm: dexProgram.name,
      };
    }
  }

  return mainProgramId ? { programId: mainProgramId } : {};
};

export const getBalanceChanges = (tx: ParsedTransactionWithMeta) => {
  return {
    preBalances: mapBalances(tx.meta?.preTokenBalances || []),
    postBalances: mapBalances(tx.meta?.postTokenBalances || []),
  };
};

export const mapBalances = (
  balances: NonNullable<ParsedTransactionWithMeta["meta"]>["preTokenBalances"],
): Record<string, Record<string, number>> => {
  const mapped: Record<string, Record<string, number>> = {};

  if (!balances) return mapped;

  for (const balance of balances) {
    if (balance.owner && balance.mint) {
      if (!mapped[balance.owner]) {
        mapped[balance.owner] = {};
      }
      mapped[balance.owner][balance.mint] = Number(
        balance.uiTokenAmount?.uiAmount || 0,
      );
    }
  }

  return mapped;
};

export const getTokenDecimals = (
  tx: ParsedTransactionWithMeta,
  mint: string,
): number => {
  const tokenBalance = tx.meta?.preTokenBalances?.find((b) => b.mint === mint);
  return tokenBalance?.uiTokenAmount?.decimals || 9;
};

export const isSupportedToken = (mint: string): boolean => {
  return Object.values(TOKENS).includes(mint);
};

export const getPoolEventBase = (
  type: PoolEventType,
  tx: ParsedTransactionWithMeta,
  programId: string,
) => {
  return {
    user: tx.transaction.message.accountKeys[0].pubkey.toBase58(),
    type,
    programId,
    amm: getProgramName(programId),
    slot: tx.slot,
    timestamp: tx.blockTime!,
    signature: tx.transaction.signatures[0],
  };
};

export const hexToUint8Array = (hex: string) => {
  return new Uint8Array(
    hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
  );
};
