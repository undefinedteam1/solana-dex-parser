import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { TOKENS } from './constants';
import { TransactionAdapter } from './transaction-adapter';
import { TransferData, convertToUiAmount } from './types';
import { getTranferTokenMint } from './utils';

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

export const processTransfer = (instruction: any, idx: string, adapter: TransactionAdapter): TransferData | null => {
  const { info } = instruction.parsed;
  if (!info) return null;

  const [token1, token2] = [
    adapter.splTokenMap.get(info.destination)?.mint,
    adapter.splTokenMap.get(info.source)?.mint,
  ];
  if (!token1 && !token2) return null;

  let mint = getTranferTokenMint(token1, token2);

  if (!mint && instruction.programId == TOKENS.NATIVE) mint = TOKENS.SOL;
  if (!mint) return null;

  const decimals = adapter.splDecimalsMap.get(mint);
  if (typeof decimals === 'undefined') return null;
  return {
    type: 'transfer',
    programId: instruction.programId,
    info: {
      authority: info.authority,
      destination: info.destination || '',
      destinationOwner: adapter.getTokenAccountOwner(info.destination),
      mint,
      source: info.source || '',
      tokenAmount: {
        amount: info.amount || info.lamports,
        decimals,
        uiAmount: convertToUiAmount(info.amount || info.lamports, decimals),
      },
      sourceBalance: adapter.getTokenAccountBalance(info.source),
      sourcePreBalance: adapter.getTokenAccountPreBalance(info.source),
      destinationBalance: adapter.getTokenAccountBalance(info.destination),
      destinationPreBalance: adapter.getTokenAccountPreBalance(info.destination),
    },
    idx: idx,
    timestamp: adapter.blockTime,
    signature: adapter.signature,
  };
};

export const processTransferCheck = (
  instruction: any,
  idx: string,
  adapter: TransactionAdapter
): TransferData | null => {
  const { info } = instruction.parsed;
  if (!info) return null;

  const decimals = adapter.splDecimalsMap.get(info.mint);
  if (typeof decimals === 'undefined') return null;

  return {
    type: 'transferChecked',
    programId: instruction.programId,
    info: {
      authority: info.authority,
      destination: info.destination || '',
      destinationOwner: adapter.getTokenAccountOwner(info.destination),
      mint: info.mint || '',
      source: info.source || '',
      tokenAmount: info.tokenAmount || {
        amount: info.amount,
        decimals,
        uiAmount: convertToUiAmount(info.amount, decimals),
      },
      sourceBalance: adapter.getTokenAccountBalance(info.source),
      sourcePreBalance: adapter.getTokenAccountPreBalance(info.source),
      destinationBalance: adapter.getTokenAccountBalance(info.destination),
      destinationPreBalance: adapter.getTokenAccountPreBalance(info.destination),
    },
    idx,
    timestamp: adapter.blockTime,
    signature: adapter.signature,
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
  adapter: TransactionAdapter,
  type: string
): TransferData | null => {
  const { info } = instruction.parsed;
  if (!info) return null;

  const mint = info.mint || adapter.splTokenMap.get(info.destination)?.mint;
  if (!mint) return null;

  const decimals = adapter.splDecimalsMap.get(mint);
  if (typeof decimals === 'undefined') return null;

  return {
    type: type,
    programId: instruction.programId,
    info: {
      authority: info.authority || info.mintAuthority || '',
      destination: info.destination || '',
      destinationOwner: adapter.getTokenAccountOwner(info.destination),
      mint,
      source: info.source || '',
      tokenAmount: {
        amount: info.amount,
        decimals,
        uiAmount: convertToUiAmount(info.amount, decimals),
      },
      sourceBalance: adapter.getTokenAccountBalance(info.source),
      sourcePreBalance: adapter.getTokenAccountPreBalance(info.source),
      destinationBalance: adapter.getTokenAccountBalance(info.destination),
      destinationPreBalance: adapter.getTokenAccountPreBalance(info.destination),
    },
    idx: idx,
    timestamp: adapter.blockTime,
    signature: adapter.signature,
  };
};
