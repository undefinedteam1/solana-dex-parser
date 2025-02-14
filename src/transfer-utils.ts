import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { ParsedInstruction, ParsedTransactionWithMeta } from "@solana/web3.js";
import { TOKENS, DEX_PROGRAMS } from "./constants";
import {
  TokenInfo,
  TransferData,
  convertToUiAmount,
  TradeInfo,
  DexInfo,
} from "./types";

export const isTransferCheck = (instruction: ParsedInstruction): boolean => {
  return (
    (instruction.programId.equals(TOKEN_PROGRAM_ID) ||
      instruction.programId.equals(TOKEN_2022_PROGRAM_ID)) &&
    instruction.parsed.type.includes("transferChecked")
  );
};

export const isTransfer = (instruction: ParsedInstruction): boolean => {
  return (
    instruction.program === "spl-token" &&
    instruction.programId.equals(TOKEN_PROGRAM_ID) &&
    instruction.parsed.type === "transfer"
  );
};

export const processTransfer = (
  instruction: ParsedInstruction,
  splTokenMap: Map<string, TokenInfo>,
  splDecimalsMap: Map<string, number>,
): TransferData | null => {
  const { info } = instruction.parsed;
  if (!info) return null;

  const mint = splTokenMap.get(info.destination)?.mint;
  if (!mint) return null;

  const decimals = splDecimalsMap.get(mint);
  if (typeof decimals === "undefined") return null;

  return {
    type: "transfer",
    info: {
      authority: info.authority || "",
      destination: info.destination || "",
      mint,
      source: info.source || "",
      tokenAmount: {
        amount: info.amount,
        decimals,
        uiAmount: convertToUiAmount(info.amount, decimals),
      },
    },
  };
};

export const processTransferCheck = (
  instruction: ParsedInstruction,
  splDecimalsMap: Map<string, number>,
): TransferData | null => {
  const { info } = instruction.parsed;
  if (!info) return null;

  const decimals = splDecimalsMap.get(info.mint);
  if (typeof decimals === "undefined") return null;

  return {
    type: "transferChecked",
    info: {
      authority: info.authority || "",
      destination: info.destination || "",
      mint: info.mint || "",
      source: info.source || "",
      tokenAmount: info.tokenAmount || {
        amount: info.amount,
        decimals,
        uiAmount: convertToUiAmount(info.amount, decimals),
      },
    },
  };
};

export const processSwapData = (
  txWithMeta: ParsedTransactionWithMeta,
  transfers: TransferData[],
  dexInfo: DexInfo,
): TradeInfo => {
  if (!transfers.length) {
    throw new Error("No swap data provided");
  }

  const uniqueTokens = extractUniqueTokens(transfers);
  if (uniqueTokens.length < 2) {
    throw new Error("Insufficient unique tokens for swap");
  }

  const { inputToken, outputToken } = calculateTokenAmounts(
    transfers,
    uniqueTokens,
  );
  const tradeType = Object.values(TOKENS).includes(inputToken.mint)
    ? "SELL"
    : "BUY";

  let signer = txWithMeta.transaction.message.accountKeys[0].pubkey.toBase58();

  // containsDCAProgram checks if the transaction contains the Jupiter DCA program.
  if (
    txWithMeta.transaction.message.accountKeys.find(
      (it) => it.pubkey.toBase58() == DEX_PROGRAMS.JUPITER_DCA.id,
    )
  ) {
    signer = txWithMeta.transaction.message.accountKeys[2].pubkey.toBase58();
  }

  return {
    type: tradeType,
    inputToken,
    outputToken,
    user: signer,
    programId: dexInfo.programId,
    amm: dexInfo.amm,
    slot: txWithMeta.slot,
    timestamp: txWithMeta.blockTime || 0,
    signature: txWithMeta.transaction.signatures[0],
  };
};

export const extractUniqueTokens = (transfers: TransferData[]): TokenInfo[] => {
  const uniqueTokens: TokenInfo[] = [];
  const seenTokens = new Set<string>();

  transfers.forEach((transfer) => {
    const tokenInfo = getTransferTokenInfo(transfer);
    if (tokenInfo && !seenTokens.has(tokenInfo.mint)) {
      uniqueTokens.push(tokenInfo);
      seenTokens.add(tokenInfo.mint);
    }
  });

  return uniqueTokens;
};

export const calculateTokenAmounts = (
  transfers: TransferData[],
  uniqueTokens: TokenInfo[],
) => {
  const inputToken = uniqueTokens[0];
  const outputToken = uniqueTokens[uniqueTokens.length - 1];

  const amounts = sumTokenAmounts(transfers, inputToken.mint, outputToken.mint);

  return {
    inputToken: {
      mint: inputToken.mint,
      amount: amounts.inputAmount,
      decimals: inputToken.decimals,
    },
    outputToken: {
      mint: outputToken.mint,
      amount: amounts.outputAmount,
      decimals: outputToken.decimals,
    },
  };
};

export const sumTokenAmounts = (
  transfers: TransferData[],
  inputMint: string,
  outputMint: string,
) => {
  const seenTransfers = new Set<string>();
  let inputAmount = 0;
  let outputAmount = 0;

  transfers.forEach((transfer) => {
    const tokenInfo = getTransferTokenInfo(transfer);
    if (!tokenInfo) return;

    const key = `${tokenInfo.amount}-${tokenInfo.mint}`;
    if (seenTransfers.has(key)) return;
    seenTransfers.add(key);

    if (tokenInfo.mint === inputMint) {
      inputAmount += tokenInfo.amount;
    }
    if (tokenInfo.mint === outputMint) {
      outputAmount += tokenInfo.amount;
    }
  });

  return { inputAmount, outputAmount };
};

export const getTransferTokenInfo = (
  transfer: TransferData,
): TokenInfo | null => {
  return transfer?.info
    ? {
        mint: transfer.info.mint,
        amount: transfer.info.tokenAmount.uiAmount,
        decimals: transfer.info.tokenAmount.decimals,
      }
    : null;
};
