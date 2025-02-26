import { ParsedTransactionWithMeta, PartiallyDecodedInstruction } from '@solana/web3.js';
import { DEX_PROGRAMS, DISCRIMINATORS } from '../constants';
import { convertToUiAmount, PoolEvent, PoolEventType, TokenInfo, TransferData } from '../types';
import { TokenInfoExtractor } from '../token-extractor';
import { getLPTransfers, processTransferInnerInstruction } from '../transfer-utils';
import base58 from 'bs58';
import { getPoolEventBase } from '../utils';

export class OrcaLiquidityParser {
  private readonly splTokenMap: Map<string, TokenInfo>;
  private readonly splDecimalsMap: Map<string, number>;

  constructor(private readonly txWithMeta: ParsedTransactionWithMeta) {
    const tokenExtractor = new TokenInfoExtractor(txWithMeta);
    this.splTokenMap = tokenExtractor.extractSPLTokenInfo();
    this.splDecimalsMap = tokenExtractor.extractDecimals();
  }

  public processLiquidity(): PoolEvent[] {
    const events = this.txWithMeta.transaction.message.instructions
      .map((instr, idx) => this.processInstruction(instr, idx))
      .filter((event): event is PoolEvent => event !== null);

    return events.length > 0 ? events : this.processInnerInstructions();
  }

  private processInnerInstructions(): PoolEvent[] {
    try {
      return this.txWithMeta.transaction.message.instructions.flatMap((_, idx) => this.processInnerInstruction(idx));
    } catch (error) {
      console.error('Error processing Meteora inner instructions:', error);
      return [];
    }
  }

  private processInnerInstruction(outerIndex: number): PoolEvent[] {
    return (this.txWithMeta.meta?.innerInstructions || [])
      .filter((set) => set.index === outerIndex)
      .flatMap((set) =>
        set.instructions
          .map((instr, innerIdx) => this.processInstruction(instr, outerIndex, innerIdx))
          .filter((event): event is PoolEvent => event !== null)
      );
  }

  private processInstruction(instruction: any, index: number, innerIndex?: number): PoolEvent | null {
    const programId = instruction.programId.toBase58();
    const parser = this.getParser(programId);
    return parser ? parser.parseInstruction(instruction, index, innerIndex) : null;
  }

  private getParser(programId: string): OrcaPoolParser | null {
    switch (programId) {
      case DEX_PROGRAMS.ORCA.id:
        return new OrcaPoolParser(this.txWithMeta, this.splTokenMap, this.splDecimalsMap);
      default:
        return null;
    }
  }
}

class OrcaPoolParser {
  constructor(
    private readonly txWithMeta: ParsedTransactionWithMeta,
    private readonly splTokenMap: Map<string, TokenInfo>,
    private readonly splDecimalsMap: Map<string, number>
  ) {}

  public getPoolAction(data: any): PoolEventType | null {
    const instructionType = data.slice(0, 8);
    if (
      instructionType.equals(DISCRIMINATORS.ORCA.ADD_LIQUIDITY) ||
      instructionType.equals(DISCRIMINATORS.ORCA.ADD_LIQUIDITY2)
    ) {
      return 'ADD';
    } else if (instructionType.equals(DISCRIMINATORS.ORCA.REMOVE_LIQUIDITY)) {
      return 'REMOVE';
    }
    return null;
  }

  public parseInstruction(
    instruction: PartiallyDecodedInstruction,
    index: number,
    innerIndex?: number
  ): PoolEvent | null {
    try {
      const data = base58.decode(instruction.data as string);
      const action = this.getPoolAction(data);
      if (!action) return null;

      const transfers = this.parseTransfers(instruction, index, innerIndex);
      switch (action) {
        case 'ADD':
          return this.parseAddLiquidityEvent(instruction, index, data, transfers);
        case 'REMOVE':
          return this.parseRemoveLiquidityEvent(instruction, index, data, transfers);
      }
      return null;
    } catch (error) {
      console.error('parseInstruction error:', error);
      return null;
    }
  }

  protected getInstructionId(index: number, innerIndex?: number): string {
    return innerIndex === undefined ? index.toString() : `${index}-${innerIndex}`;
  }

  protected parseTransfers(
    instruction: PartiallyDecodedInstruction,
    index: number,
    innerIndex?: number
  ): TransferData[] {
    const curIdx = this.getInstructionId(index, innerIndex);
    const accounts = instruction.accounts.map((acc) => acc.toBase58());
    return processTransferInnerInstruction(this.txWithMeta, index, this.splTokenMap, this.splDecimalsMap).filter(
      (transfer) => accounts.includes(transfer.info.destination) && transfer.idx >= curIdx
    );
  }

  private parseAddLiquidityEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: any,
    transfers: TransferData[]
  ): PoolEvent {
    const [token0, token1] = getLPTransfers(transfers);
    const token0Mint = token0?.info.mint;
    const token1Mint = token1?.info.mint;
    const programId = instruction.programId.toBase58();
    return {
      ...getPoolEventBase('ADD', this.txWithMeta, programId),
      idx: index.toString(),
      poolId: instruction.accounts[0].toString(),
      poolLpMint: instruction.accounts[0].toString(),
      token0Mint: token0Mint,
      token1Mint: token1Mint,
      token0Amount:
        token0?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(32), this.splDecimalsMap.get(token0Mint)),
      token1Amount:
        token1?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(24), this.splDecimalsMap.get(token1Mint)),
      lpAmount:
        convertToUiAmount(data.readBigUInt64LE(8), this.splDecimalsMap.get(instruction.accounts[1].toString())) || 0,
    };
  }

  private parseRemoveLiquidityEvent(
    instruction: PartiallyDecodedInstruction,
    index: number,
    data: any,
    transfers: TransferData[]
  ): PoolEvent {
    const [token0, token1] = getLPTransfers(transfers);
    const token0Mint = token0?.info.mint;
    const token1Mint = token1?.info.mint;
    const programId = instruction.programId.toBase58();
    return {
      ...getPoolEventBase('REMOVE', this.txWithMeta, programId),
      idx: index.toString(),
      poolId: instruction.accounts[0].toString(),
      poolLpMint: instruction.accounts[0].toString(),
      token0Mint: token0Mint,
      token1Mint: token1Mint,
      token0Amount:
        token0?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(32), this.splDecimalsMap.get(token0Mint)),
      token1Amount:
        token1?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(24), this.splDecimalsMap.get(token1Mint)),
      lpAmount: convertToUiAmount(data.readBigUInt64LE(8), this.splDecimalsMap.get(instruction.accounts[1].toString())),
    };
  }
}
