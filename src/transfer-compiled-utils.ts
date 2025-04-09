import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { SPL_TOKEN_INSTRUCTION_TYPES, TOKENS } from './constants';
import { TokenInfo, TransferData, convertToUiAmount } from './types';
import { getInstructionData, getTranferTokenMint } from './utils';
import { TransactionAdapter } from './transaction-adapter';

export const isCompiledTransfer = (instruction: any): boolean => {
  const data = getInstructionData(instruction);
  return (
    (instruction.programId == TOKEN_PROGRAM_ID.toBase58() && data[0] == SPL_TOKEN_INSTRUCTION_TYPES.Transfer) ||
    (instruction.programId == TOKENS.NATIVE && data[0] == 2)
  );
};

export const isCompiledTransferCheck = (instruction: any): boolean => {
  const data = getInstructionData(instruction);
  return (
    (instruction.programId == TOKEN_PROGRAM_ID.toBase58() ||
      instruction.programId == TOKEN_2022_PROGRAM_ID.toBase58()) &&
    data[0] == SPL_TOKEN_INSTRUCTION_TYPES.TransferChecked
  );
};

export const processCompiledTransfer = (
  instruction: any,
  idx: string,
  adapter: TransactionAdapter,
): TransferData | null => {
  const accounts = instruction.accounts as string[];
  const data = getInstructionData(instruction);
  const amount = data.readBigUInt64LE(1);
  let authority;
  const [source, destination] = [accounts[0], accounts[1]]; // source, destination,amount, authority
  if (data[0] == SPL_TOKEN_INSTRUCTION_TYPES.Transfer) authority = accounts[2];

  const [token1, token2] = [adapter.splTokenMap.get(destination)?.mint, adapter.splTokenMap.get(source)?.mint];
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
      authority: authority || '',
      destination: destination || '',
      destinationOwner: adapter.getTokenAccountOwner(destination || ''),
      mint,
      source: source || '',
      tokenAmount: {
        amount: amount.toString(),
        decimals,
        uiAmount: convertToUiAmount(amount, decimals),
      },
    },
    idx: idx,
  };
};

export const processCompiledTransferCheck = (
  instruction: any,
  idx: string,
  adapter: TransactionAdapter
): TransferData | null => {
  const accounts = instruction.accounts as string[];
  if (!accounts) null;
  const [source, mint, destination, authority] = [accounts[0], accounts[1], accounts[2], accounts[3]]; // source, mint, destination, authority,amount,decimals
  const data = getInstructionData(instruction);
  const amount = data.readBigUInt64LE(1);
  const decimals = adapter.splDecimalsMap.get(mint) || data.readUint8(9);
  return {
    type: 'transferChecked',
    programId: instruction.programId,
    info: {
      authority: authority || '',
      destination: destination || '',
      destinationOwner: adapter.getTokenAccountOwner(destination || ''),
      mint,
      source: source || '',
      tokenAmount: {
        amount: amount.toString(),
        decimals,
        uiAmount: convertToUiAmount(amount, decimals),
      },
    },
    idx: idx,
  };
};

export const isCompiledExtraAction = (instruction: any, type: string): boolean => {
  if (instruction.programId != TOKEN_PROGRAM_ID.toBase58() && instruction.programId != TOKEN_2022_PROGRAM_ID.toBase58())
    return false;

  const data = getInstructionData(instruction);
  const instructionType = data[0];

  const typeMap: Record<string, number> = {
    mintTo: SPL_TOKEN_INSTRUCTION_TYPES.MintTo,
    burn: SPL_TOKEN_INSTRUCTION_TYPES.Burn,
    mintToChecked: SPL_TOKEN_INSTRUCTION_TYPES.MintToChecked,
    burnChecked: SPL_TOKEN_INSTRUCTION_TYPES.BurnChecked,
  };

  return typeMap[type] === instructionType;
};

export const processCompiledExtraAction = (
  instruction: any,
  idx: string,
  adapter: TransactionAdapter,
  type: string
): TransferData | null => {
  const accounts = instruction.accounts as string[];
  if (!accounts) return null;
  const data = getInstructionData(instruction);
  let source, destination, authority, mint, decimals;
  const amount = data.readBigUInt64LE(1);

  switch (data[0]) {
    case SPL_TOKEN_INSTRUCTION_TYPES.MintTo:
      if (accounts.length < 2) return null;
      [mint, destination, authority] = [accounts[0], accounts[1], accounts[2]]; // mint, destination, authority, amount
      break;
    case SPL_TOKEN_INSTRUCTION_TYPES.MintToChecked:
      if (accounts.length < 3) return null;
      [mint, destination, authority] = [accounts[0], accounts[1], accounts[2]]; // mint, destination, authority, amount,decimals
      decimals = data.readUint8(9);
      break;
    case SPL_TOKEN_INSTRUCTION_TYPES.Burn:
      if (accounts.length < 2) return null;
      [source, mint, authority] = [accounts[0], accounts[1], accounts[2]]; // account, mint, authority, amount
      break;
    case SPL_TOKEN_INSTRUCTION_TYPES.BurnChecked:
      if (accounts.length < 3) return null;
      [source, mint, authority] = [accounts[0], accounts[1], accounts[2]]; // account, mint, authority, amount,decimals
      decimals = data.readUint8(9);
      break;
  }

  mint = mint || (destination && adapter.splTokenMap.get(destination)?.mint);
  if (!mint) return null;

  decimals = decimals || adapter.splDecimalsMap.get(mint);
  if (!decimals) return null;

  return {
    type: type,
    programId: instruction.programId,
    info: {
      authority: authority || '',
      destination: destination || '',
      destinationOwner: adapter.getTokenAccountOwner(destination || ''),
      mint,
      source: source || '',
      tokenAmount: {
        amount: amount.toString(),
        decimals,
        uiAmount: convertToUiAmount(amount, decimals),
      },
    },
    idx: idx,
  };
};
