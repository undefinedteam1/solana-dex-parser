import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { ParsedInstruction } from '@solana/web3.js';
import { TOKENS } from './constants';
import { TokenInfo, TransferData, convertToUiAmount } from './types';

export const isTransferCheck = (instruction: any): boolean => {
  return (
    (instruction.programId == TOKEN_PROGRAM_ID.toBase58() ||
      instruction.programId == TOKEN_2022_PROGRAM_ID.toBase58()) &&
    instruction.parsed.type.includes('transferChecked')
  );
};

export const isTransfer = (instruction: any): boolean => {
  return (
    (instruction.program === 'spl-token' &&
      instruction.programId == TOKEN_PROGRAM_ID.toBase58() &&
      instruction.parsed.type === 'transfer') ||
    (instruction.program === 'system' &&
      instruction.programId == TOKENS.NATIVE &&
      instruction.parsed.type === 'transfer')
  );
};

export const processTransfer = (
  instruction: any,
  idx: string,
  splTokenMap: Map<string, TokenInfo>,
  splDecimalsMap: Map<string, number>
): TransferData | null => {
  const { info } = instruction.parsed;
  if (!info) return null;

  let mint = splTokenMap.get(info.destination)?.mint;
  if (!mint) mint = splTokenMap.get(info.source)?.mint;
  if (!mint && instruction.programId == TOKENS.NATIVE) mint = TOKENS.SOL;
  if (!mint) return null;

  const decimals = splDecimalsMap.get(mint);
  if (typeof decimals === 'undefined') return null;

  return {
    type: 'transfer',
    info: {
      authority: info.authority || '',
      destination: info.destination || '',
      mint,
      source: info.source || '',
      tokenAmount: {
        amount: info.amount || info.lamports,
        decimals,
        uiAmount: convertToUiAmount(info.amount || info.lamports, decimals),
      },
    },
    idx: idx,
  };
};

export const processTransferCheck = (
  instruction: ParsedInstruction,
  idx: string,
  splDecimalsMap: Map<string, number>
): TransferData | null => {
  const { info } = instruction.parsed;
  if (!info) return null;

  const decimals = splDecimalsMap.get(info.mint);
  if (typeof decimals === 'undefined') return null;

  return {
    type: 'transferChecked',
    info: {
      authority: info.authority || '',
      destination: info.destination || '',
      mint: info.mint || '',
      source: info.source || '',
      tokenAmount: info.tokenAmount || {
        amount: info.amount,
        decimals,
        uiAmount: convertToUiAmount(info.amount, decimals),
      },
    },
    idx,
  };
};

export const isExtraAction = (instruction: any, type: string): boolean => {
  return (
    instruction.program === 'spl-token' &&
    instruction.programId == TOKEN_PROGRAM_ID.toBase58() &&
    instruction.parsed.type === type
  );
};

export const processExtraAction = (
  instruction: any,
  idx: string,
  splTokenMap: Map<string, TokenInfo>,
  splDecimalsMap: Map<string, number>,
  type: string
): TransferData | null => {
  const { info } = instruction.parsed;
  if (!info) return null;

  const mint = info.mint || splTokenMap.get(info.destination)?.mint;
  if (!mint) return null;

  const decimals = splDecimalsMap.get(mint);
  if (typeof decimals === 'undefined') return null;

  return {
    type: type,
    info: {
      authority: info.authority || info.mintAuthority || '',
      destination: info.destination || '',
      mint,
      source: info.source || '',
      tokenAmount: {
        amount: info.amount,
        decimals,
        uiAmount: convertToUiAmount(info.amount, decimals),
      },
    },
    idx: idx,
  };
};
