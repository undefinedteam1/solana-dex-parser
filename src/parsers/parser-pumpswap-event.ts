import { Buffer } from 'buffer';
import { DEX_PROGRAMS, DISCRIMINATORS } from '../constants';
import { TransactionAdapter } from '../transaction-adapter';
import {
  PumpswapBuyEvent,
  PumpswapCreatePoolEvent,
  PumpswapDepositEvent,
  PumpswapEvent,
  PumpswapSellEvent,
  PumpswapWithdrawEvent,
} from '../types';
import { getInstructionData } from '../utils';
import { BinaryReader } from './parser-pumpfun-event';

export class PumpswapEventParser {
  constructor(private readonly adapter: TransactionAdapter) {}

  public processEvents(): PumpswapEvent[] {
    const events = this.adapter.instructions
      .map((instr: any, idx: number) => this.processInstruction(instr, idx))
      .filter((event: any): event is PumpswapEvent => event !== null);

    return events.length > 0 ? events : this.processInnerInstructions();
  }

  private processInnerInstructions(): PumpswapEvent[] {
    try {
      return this.adapter.instructions.flatMap((_: any, idx: number) => this.processInnerInstruction(idx));
    } catch (error) {
      console.error('Error processing Meteora inner instructions:', error);
      return [];
    }
  }

  public processInnerInstruction(outerIndex: number): PumpswapEvent[] {
    return (this.adapter.innerInstructions || [])
      .filter((set) => set.index === outerIndex)
      .flatMap((set) =>
        set.instructions
          .map((instr, innerIdx) => this.processInstruction(instr, outerIndex, innerIdx))
          .filter((event): event is PumpswapEvent => event !== null)
      );
  }

  private processInstruction(instruction: any, index: number, innerIndex?: number): PumpswapEvent | null {
    const programId = this.adapter.getInstructionProgramId(instruction);
    if (DEX_PROGRAMS.PUMP_SWAP.id != programId) return null;

    const txMeta = {
      slot: this.adapter.slot,
      timestamp: this.adapter.blockTime || 0,
      signature: this.adapter.signature,
    };
    if (this.isPumpswapCreatePoolEvent(instruction)) {
      const event = this.parseCreateEvent(instruction);
      if (event) {
        return {
          type: 'CREATE',
          data: event,
          ...txMeta,
          idx: `${index}-${innerIndex}`,
        };
      }
    }
    if (this.isPumpswapAddLiquidity(instruction)) {
      const event = this.parseAddLiquidity(instruction);
      if (event) {
        return {
          type: 'ADD',
          data: event,
          ...txMeta,
          idx: `${index}-${innerIndex}`,
        };
      }
    }
    if (this.isPumpswapRemoveLiquidity(instruction)) {
      const event = this.parseRemoveLiquidity(instruction);
      if (event) {
        return {
          type: 'REMOVE',
          data: event,
          ...txMeta,
          idx: `${index}-${innerIndex}`,
        };
      }
    }
    if (this.isPumpswapBuyEvent(instruction)) {
      const event = this.parseBuyEvent(instruction);
      if (event) {
        return {
          type: 'BUY',
          data: event,
          ...txMeta,
          idx: `${index}-${innerIndex}`,
        };
      }
    }
    if (this.isPumpswapSellEvent(instruction)) {
      const event = this.parseSellEvent(instruction);
      if (event) {
        return {
          type: 'SELL',
          data: event,
          ...txMeta,
          idx: `${index}-${innerIndex}`,
        };
      }
    }
    return null;
  }

  private isPumpswapBuyEvent(instruction: any): boolean {
    try {
      if (this.adapter.getInstructionProgramId(instruction) != DEX_PROGRAMS.PUMP_SWAP.id) return false;
      const data = getInstructionData(instruction);
      return Buffer.from(data.slice(0, 16)).equals(DISCRIMINATORS.PUMPSWAP.BUY);
    } catch {
      return false;
    }
  }

  private parseBuyEvent(instruction: any): PumpswapBuyEvent | null {
    try {
      const data = getInstructionData(instruction);
      return this.decodeBuyEvent(data.slice(16));
    } catch (error) {
      console.error('Failed to parse Pumpswap buy event:', error);
      return null;
    }
  }

  private decodeBuyEvent(data: Buffer): PumpswapBuyEvent {
    const reader = new BinaryReader(data);
    return {
      timestamp: Number(reader.readI64()),
      baseAmountOut: reader.readU64(),
      maxQuoteAmountIn: reader.readU64(),
      userBaseTokenReserves: reader.readU64(),
      userQuoteTokenReserves: reader.readU64(),
      poolBaseTokenReserves: reader.readU64(),
      poolQuoteTokenReserves: reader.readU64(),
      quoteAmountIn: reader.readU64(),
      lpFeeBasisPoints: reader.readU64(),
      lpFee: reader.readU64(),
      protocolFeeBasisPoints: reader.readU64(),
      protocolFee: reader.readU64(),
      quoteAmountInWithLpFee: reader.readU64(),
      userQuoteAmountIn: reader.readU64(),
      pool: reader.readPubkey(),
      user: reader.readPubkey(),
      userBaseTokenAccount: reader.readPubkey(),
      userQuoteTokenAccount: reader.readPubkey(),
      protocolFeeRecipient: reader.readPubkey(),
      protocolFeeRecipientTokenAccount: reader.readPubkey(),
    };
  }

  private isPumpswapSellEvent(instruction: any): boolean {
    try {
      if (this.adapter.getInstructionProgramId(instruction) != DEX_PROGRAMS.PUMP_SWAP.id) return false;
      const data = getInstructionData(instruction);
      return Buffer.from(data.slice(0, 16)).equals(DISCRIMINATORS.PUMPSWAP.SELL);
    } catch {
      return false;
    }
  }

  private parseSellEvent(instruction: any): PumpswapSellEvent | null {
    try {
      const data = getInstructionData(instruction);
      return this.decodeSellEvent(data.slice(16));
    } catch (error) {
      console.error('Failed to parse Pumpswap sell event:', error);
      return null;
    }
  }

  private decodeSellEvent(data: Buffer): PumpswapSellEvent {
    const reader = new BinaryReader(data);

    return {
      timestamp: Number(reader.readI64()),
      baseAmountIn: reader.readU64(),
      minQuoteAmountOut: reader.readU64(),
      userBaseTokenReserves: reader.readU64(),
      userQuoteTokenReserves: reader.readU64(),
      poolBaseTokenReserves: reader.readU64(),
      poolQuoteTokenReserves: reader.readU64(),
      quoteAmountOut: reader.readU64(),
      lpFeeBasisPoints: reader.readU64(),
      lpFee: reader.readU64(),
      protocolFeeBasisPoints: reader.readU64(),
      protocolFee: reader.readU64(),
      quoteAmountOutWithLpFee: reader.readU64(),
      userQuoteAmountOut: reader.readU64(),
      pool: reader.readPubkey(),
      user: reader.readPubkey(),
      userBaseTokenAccount: reader.readPubkey(),
      userQuoteTokenAccount: reader.readPubkey(),
      protocolFeeRecipient: reader.readPubkey(),
      protocolFeeRecipientTokenAccount: reader.readPubkey(),
    };
  }

  private isPumpswapAddLiquidity(instruction: any): boolean {
    try {
      if (this.adapter.getInstructionProgramId(instruction) != DEX_PROGRAMS.PUMP_SWAP.id) return false;
      const data = getInstructionData(instruction);
      return Buffer.from(data.slice(0, 16)).equals(DISCRIMINATORS.PUMPSWAP.ADD_LIQUIDITY);
    } catch {
      return false;
    }
  }

  private parseAddLiquidity(instruction: any): PumpswapDepositEvent | null {
    try {
      const data = getInstructionData(instruction);
      return this.decodeAddLiquidity(data.slice(16));
    } catch (error) {
      console.error('Failed to parse Pumpswap trade event:', error);
      return null;
    }
  }

  private decodeAddLiquidity(data: Buffer): PumpswapDepositEvent {
    const reader = new BinaryReader(data);

    return {
      timestamp: Number(reader.readI64()),
      lpTokenAmountOut: reader.readU64(),
      maxBaseAmountIn: reader.readU64(),
      maxQuoteAmountIn: reader.readU64(),
      userBaseTokenReserves: reader.readU64(),
      userQuoteTokenReserves: reader.readU64(),
      poolBaseTokenReserves: reader.readU64(),
      poolQuoteTokenReserves: reader.readU64(),
      baseAmountIn: reader.readU64(),
      quoteAmountIn: reader.readU64(),
      lpMintSupply: reader.readU64(),

      pool: reader.readPubkey(),
      user: reader.readPubkey(),
      userBaseTokenAccount: reader.readPubkey(),
      userQuoteTokenAccount: reader.readPubkey(),
      userPoolTokenAccount: reader.readPubkey(),
    };
  }

  private isPumpswapCreatePoolEvent(instruction: any): boolean {
    try {
      const programId = this.adapter.getInstructionProgramId(instruction);
      if (programId != DEX_PROGRAMS.PUMP_SWAP.id) return false;
      const data = getInstructionData(instruction);
      return Buffer.from(data.slice(0, 16)).equals(DISCRIMINATORS.PUMPSWAP.CREATE_POOL);
    } catch {
      return false;
    }
  }

  private parseCreateEvent(instruction: any): PumpswapCreatePoolEvent | null {
    try {
      const data = getInstructionData(instruction);
      return this.decodeCreateEvent(data.slice(16));
    } catch (error) {
      console.error('Failed to parse Pumpswap create event:', error);
      return null;
    }
  }

  private decodeCreateEvent(data: Buffer): PumpswapCreatePoolEvent {
    const reader = new BinaryReader(data);
    return {
      timestamp: Number(reader.readI64()),
      index: reader.readU16(),
      creator: reader.readPubkey(),
      baseMint: reader.readPubkey(),
      quoteMint: reader.readPubkey(),
      baseMintDecimals: reader.readU8(),
      quoteMintDecimals: reader.readU8(),
      baseAmountIn: reader.readU64(),
      quoteAmountIn: reader.readU64(),
      poolBaseAmount: reader.readU64(),
      poolQuotAmount: reader.readU64(),
      minimumLiquidity: reader.readU64(),
      initialLiquidity: reader.readU64(),
      lpTokenAmountOut: reader.readU64(),
      poolBump: reader.readU8(),
      pool: reader.readPubkey(),
      lpMint: reader.readPubkey(),
      userBaseTokenAccount: reader.readPubkey(),
      userQuoteTokenAccount: reader.readPubkey(),
    };
  }

  private isPumpswapRemoveLiquidity(instruction: any): boolean {
    try {
      const programId = this.adapter.getInstructionProgramId(instruction);
      if (programId != DEX_PROGRAMS.PUMP_SWAP.id) return false;
      const data = getInstructionData(instruction);
      return Buffer.from(data.slice(0, 16)).equals(DISCRIMINATORS.PUMPSWAP.REMOVE_LIQUIDITY);
    } catch {
      return false;
    }
  }

  private parseRemoveLiquidity(instruction: any): PumpswapWithdrawEvent | null {
    try {
      const data = getInstructionData(instruction);
      return this.decodeRemoveLiquidity(data.slice(16));
    } catch (error) {
      console.error('Failed to parse Pumpswap complete event:', error);
      return null;
    }
  }

  private decodeRemoveLiquidity(data: Buffer): PumpswapWithdrawEvent {
    const reader = new BinaryReader(data);
    return {
      timestamp: Number(reader.readI64()),
      lpTokenAmountIn: reader.readU64(),
      minBaseAmountOut: reader.readU64(),
      minQuoteAmountOut: reader.readU64(),
      userBaseTokenReserves: reader.readU64(),
      userQuoteTokenReserves: reader.readU64(),
      poolBaseTokenReserves: reader.readU64(),
      poolQuoteTokenReserves: reader.readU64(),
      baseAmountOut: reader.readU64(),
      quoteAmountOut: reader.readU64(),
      lpMintSupply: reader.readU64(),
      pool: reader.readPubkey(),
      user: reader.readPubkey(),
      userBaseTokenAccount: reader.readPubkey(),
      userQuoteTokenAccount: reader.readPubkey(),
      userPoolTokenAccount: reader.readPubkey(),
    };
  }
}
