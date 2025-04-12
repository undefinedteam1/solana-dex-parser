import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { MessageV0, PublicKey } from '@solana/web3.js';
import { SPL_TOKEN_INSTRUCTION_TYPES, TOKENS } from './constants';
import { convertToUiAmount, ParseConfig, PoolEventType, SolanaTransaction, TokenInfo } from './types';
import { getInstructionData, getProgramName } from './utils';

/**
 * Adapter for unified transaction data access
 */
export class TransactionAdapter {
  public readonly accountKeys: string[] = [];
  public readonly splTokenMap: Map<string, TokenInfo> = new Map();
  public readonly splDecimalsMap: Map<string, number> = new Map();

  constructor(
    private tx: SolanaTransaction,
    public config?: ParseConfig
  ) {
    this.accountKeys = this.extractAccountKeys();
    this.extractTokenInfo();
  }

  get txMessage() {
    return this.tx.transaction.message as any;
  }

  get isMessageV0() {
    return this.tx.transaction.message instanceof MessageV0;
  }
  /**
   * Get transaction slot
   */
  get slot() {
    return this.tx.slot;
  }

  get version() {
    return this.tx.version;
  }

  /**
   * Get transaction block time
   */
  get blockTime() {
    return this.tx.blockTime || 0;
  }

  /**
   * Get transaction signature
   */
  get signature() {
    return this.tx.transaction.signatures[0];
  }

  /**
   * Get all instructions
   */
  get instructions() {
    return this.txMessage.instructions || this.txMessage.compiledInstructions;
  }

  /**
   * Get inner instructions
   */
  get innerInstructions() {
    return this.tx.meta?.innerInstructions;
  }

  /**
   * Get pre balances
   */
  get preBalances() {
    return this.tx.meta?.preBalances;
  }

  /**
   * Get post balances
   */
  get postBalances() {
    return this.tx.meta?.postBalances;
  }

  /**
   * Get pre token balances
   */
  get preTokenBalances() {
    return this.tx.meta?.preTokenBalances;
  }

  /**
   * Get post token balances
   */
  get postTokenBalances() {
    return this.tx.meta?.postTokenBalances;
  }

  /**
   * Get first signer account
   */
  get signer(): string {
    return this.getAccountKey(0);
  }

  extractAccountKeys() {
    if (this.isMessageV0) {
      const keys = this.txMessage.staticAccountKeys.map((it: any) => it.toBase58()) || [];
      const key2 = this.tx.meta?.loadedAddresses?.writable.map((it) => it.toBase58()) || [];
      const key3 = this.tx.meta?.loadedAddresses?.readonly.map((it) => it.toBase58()) || [];
      return [...keys, ...key2, ...key3];
    } else if (this.version == 0) {
      const keys = this.getAccountKeys(this.txMessage.accountKeys) || [];
      const key2 = this.getAccountKeys(this.tx.meta?.loadedAddresses?.writable ?? []) || [];
      const key3 = this.getAccountKeys(this.tx.meta?.loadedAddresses?.readonly ?? []) || [];
      return [...keys, ...key2, ...key3];
    } else {
      return this.getAccountKeys(this.txMessage.accountKeys) || [];
    }
  }

  /**
   * Get unified instruction data
   */
  getInstruction(instruction: any) {
    const isParsed = !this.isCompiledInstruction(instruction);
    return {
      programId: isParsed ? instruction.programId.toBase58() : this.accountKeys[instruction.programIdIndex],
      accounts: this.getInstructionAccounts(instruction),
      data: 'data' in instruction ? instruction.data : '',
      parsed: 'parsed' in instruction ? instruction.parsed : undefined,
      program: instruction.program || '',
    };
  }

  getInnerInstruction(outerIndex: number, innterIndex: number) {
    return this.innerInstructions?.find((it) => it.index == outerIndex)?.instructions[innterIndex];
  }

  getAccountKeys(accounts: any[]): string[] {
    return accounts?.map((it: any) => {
      if (it instanceof PublicKey) return it.toBase58();
      if (typeof it == 'string') return it;
      if (typeof it == 'number') return this.accountKeys[it];
      if ('pubkey' in it) return it.pubkey.toBase58();
      return it;
    });
  }

  getInstructionAccounts(instruction: any): string[] {
    const accounts = instruction.accounts || instruction.accountKeyIndexes;
    return this.getAccountKeys(accounts);
  }

  /**
   * Check if instruction is Compiled
   */
  isCompiledInstruction(instruction: any): boolean {
    return 'programIdIndex' in instruction && !('parsed' in instruction);
  }

  /**
   * Get instruction type
   * returns string name if instruction Parsed, e.g. 'transfer';
   * returns number if instruction is Compiled, e.g. 3
   */
  getInstructionType(instruction: any): string | undefined {
    if ('parsed' in instruction && instruction.parsed) {
      return instruction.parsed.type; // string name, e.g. 'transfer'
    }

    // For compiled instructions, try to decode type from data
    const data = getInstructionData(instruction);
    return data.length > 0 ? data[0].toString() : undefined; // number, e.g. 3
  }

  /**
   * Get account key by index
   */
  getAccountKey(index: number): string {
    return this.accountKeys[index];
  }

  /**
   * Get token account owner
   */
  getTokenAccountOwner(accountKey: string): string | undefined {
    const accountInfo = this.tx.meta?.postTokenBalances?.find(
      (balance) => this.accountKeys[balance.accountIndex] === accountKey
    );

    if (accountInfo) {
      return accountInfo.owner;
    }

    return undefined;
  }

  getTokenAccountBalance(accountKey: string): number | string | undefined {
    const accountInfo = this.tx.meta?.postTokenBalances?.find(
      (balance) => this.accountKeys[balance.accountIndex] === accountKey
    );

    if (accountInfo) {
      return this.config?.rawAmount ? accountInfo.uiTokenAmount.amount : (accountInfo.uiTokenAmount?.uiAmount ?? 0);
    }

    return undefined;
  }

  getTokenAccountPreBalance(accountKey: string): number | string | undefined {
    const accountInfo = this.tx.meta?.preTokenBalances?.find(
      (balance) => this.accountKeys[balance.accountIndex] === accountKey
    );

    if (accountInfo) {
      return this.config?.rawAmount ? accountInfo.uiTokenAmount.amount : (accountInfo.uiTokenAmount?.uiAmount ?? 0);
    }

    return undefined;
  }

  private readonly defaultSolInfo: TokenInfo = {
    mint: TOKENS.SOL,
    amount: 0,
    decimals: 9,
  };

  /**
   * Check if token is supported
   */
  isSupportedToken(mint: string): boolean {
    return Object.values(TOKENS).includes(mint);
  }

  /**
   * Get rawAmount or uiAmount
   */
  getFormatAmount(amount: bigint | string, uiAmount?: number, decimals?: number): number | string {
    return this.config?.rawAmount ? amount.toString() : uiAmount || convertToUiAmount(amount, decimals);
  }

  /**
   * Get program ID from instruction
   */
  getInstructionProgramId(instruction: any): string {
    const ix = this.getInstruction(instruction);
    return ix.programId;
  }

  getTokenDecimals(mint: string): number {
    return (
      this.preTokenBalances?.find((b) => b.mint === mint)?.uiTokenAmount?.decimals ||
      this.postTokenBalances?.find((b) => b.mint === mint)?.uiTokenAmount?.decimals ||
      9
    );
  }

  /**
   * Create base pool event data
   * @param type - Type of pool event
   * @param tx - The parsed transaction with metadata
   * @param programId - The program ID associated with the event
   * @returns Base pool event object
   */
  getPoolEventBase = (type: PoolEventType, programId: string) => ({
    user: this.signer,
    type,
    programId,
    amm: getProgramName(programId),
    slot: this.slot,
    timestamp: this.blockTime,
    signature: this.signature,
  });

  /**
   * Extract token information from transaction
   */
  private extractTokenInfo() {
    // Process token balances
    this.extractTokenBalances();

    // Process transfer instructions for additional token info
    this.extractTokenFromInstructions();

    // Add SOL token info if not exists
    if (!this.splTokenMap.has(TOKENS.SOL)) {
      this.splTokenMap.set(TOKENS.SOL, this.defaultSolInfo);
    }

    if (!this.splDecimalsMap.has(TOKENS.SOL)) {
      this.splDecimalsMap.set(TOKENS.SOL, this.defaultSolInfo.decimals);
    }
  }

  /**
   * Extract token balances from pre and post states
   */
  private extractTokenBalances() {
    const postBalances = this.postTokenBalances || [];
    postBalances.forEach((balance) => {
      if (!balance.mint) return;

      const accountKey = this.accountKeys[balance.accountIndex];
      if (!this.splTokenMap.has(accountKey)) {
        const tokenInfo: TokenInfo = {
          mint: balance.mint,
          amount: this.config?.rawAmount ? balance.uiTokenAmount.amount : Number(balance.uiTokenAmount.uiAmount || 0),
          decimals: balance.uiTokenAmount.decimals,
        };
        this.splTokenMap.set(accountKey, tokenInfo);
      }

      if (!this.splDecimalsMap.has(balance.mint)) {
        this.splDecimalsMap.set(balance.mint, balance.uiTokenAmount.decimals);
      }
    });
  }

  /**
   * Extract token info from transfer instructions
   */
  private extractTokenFromInstructions() {
    this.instructions.forEach((ix: any) => {
      if (this.isCompiledInstruction(ix)) {
        this.extractFromCompiledTransfer(ix);
      } else {
        this.extractFromParsedTransfer(ix);
      }
    });

    // Process inner instructions
    this.innerInstructions?.forEach((inner) => {
      inner.instructions.forEach((ix) => {
        if (this.isCompiledInstruction(ix)) {
          this.extractFromCompiledTransfer(ix);
        } else {
          this.extractFromParsedTransfer(ix);
        }
      });
    });
  }

  /**
   * Extract token info from parsed transfer instruction
   */
  private extractFromParsedTransfer(ix: any) {
    if (!ix.parsed || !ix.program) return;
    if (ix.programId != TOKEN_PROGRAM_ID.toBase58() && ix.programId != TOKEN_2022_PROGRAM_ID.toBase58()) return;

    const { source, destination } = ix.parsed?.info || {};
    if (!source && !destination) return;
    if (source && !this.splTokenMap.has(source)) {
      this.splTokenMap.set(source, this.defaultSolInfo);
    }
    if (destination && !this.splTokenMap.has(destination)) {
      this.splTokenMap.set(destination, this.defaultSolInfo);
    }
  }

  /**
   * Extract token info from compiled transfer instruction
   */
  private extractFromCompiledTransfer(ix: any) {
    const decoded = getInstructionData(ix);
    if (!decoded) return;
    const programId = this.accountKeys[ix.programIdIndex];
    if (programId != TOKEN_PROGRAM_ID.toBase58() && programId != TOKEN_2022_PROGRAM_ID.toBase58()) return;

    let source, destination, mint, decimals;
    // const amount = decoded.readBigUInt64LE(1);
    const accounts = ix.accounts as number[];
    if (!accounts) return;
    switch (decoded[0]) {
      case SPL_TOKEN_INSTRUCTION_TYPES.Transfer:
        if (accounts.length < 3) return;
        [source, destination] = [this.accountKeys[accounts[0]], this.accountKeys[accounts[1]]]; // source, destination,amount, authority
        break;
      case SPL_TOKEN_INSTRUCTION_TYPES.TransferChecked:
        if (accounts.length < 4) return;
        [source, mint, destination] = [
          this.accountKeys[accounts[0]],
          this.accountKeys[accounts[1]],
          this.accountKeys[accounts[2]],
        ]; // source, mint, destination, authority,amount,decimals
        decimals = decoded.readUint8(9);
        break;
      case SPL_TOKEN_INSTRUCTION_TYPES.InitializeMint:
        if (accounts.length < 2) return;
        [mint, destination] = [this.accountKeys[accounts[0]], this.accountKeys[accounts[1]]]; // mint, decimals, authority,freezeAuthority
        break;
      case SPL_TOKEN_INSTRUCTION_TYPES.MintTo:
        if (accounts.length < 2) return;
        [mint, destination] = [this.accountKeys[accounts[0]], this.accountKeys[accounts[1]]]; // mint, destination, authority, amount
        break;
      case SPL_TOKEN_INSTRUCTION_TYPES.MintToChecked:
        if (accounts.length < 3) return;
        [mint, destination] = [this.accountKeys[accounts[0]], this.accountKeys[accounts[1]]]; // mint, destination, authority, amount,decimals
        decimals = decoded.readUint8(9);
        break;
      case SPL_TOKEN_INSTRUCTION_TYPES.Burn:
        if (accounts.length < 2) return;
        [source, mint] = [this.accountKeys[accounts[0]], this.accountKeys[accounts[1]]]; // account, mint, authority, amount
        break;
      case SPL_TOKEN_INSTRUCTION_TYPES.BurnChecked:
        if (accounts.length < 3) return;
        [source, mint] = [this.accountKeys[accounts[0]], this.accountKeys[accounts[1]]]; // account, mint, authority, amount,decimals
        decimals = decoded.readUint8(9);
        break;
      case SPL_TOKEN_INSTRUCTION_TYPES.CloseAccount:
        if (accounts.length < 3) return;
        [source, destination] = [this.accountKeys[accounts[0]], this.accountKeys[accounts[1]]]; // account, destination, authority
        break;
    }

    if (source && !this.splTokenMap.has(source)) {
      this.splTokenMap.set(source, this.defaultSolInfo);
    }

    if (destination && !this.splTokenMap.has(destination)) {
      this.splTokenMap.set(destination, this.defaultSolInfo);
    }

    if (mint && decimals && !this.splDecimalsMap.has(mint)) {
      this.splDecimalsMap.set(mint, decimals);
    }
  }
}
