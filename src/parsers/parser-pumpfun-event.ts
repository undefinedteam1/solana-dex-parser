import {
  ParsedTransactionWithMeta,
  PartiallyDecodedInstruction,
} from "@solana/web3.js";
import { Buffer } from "buffer";
import base58 from "bs58";
import { DEX_PROGRAMS, DISCRIMINATORS } from "../constants";
import {
  convertToUiAmount,
  DexInfo,
  PumpfunCompleteEvent,
  PumpfunCreateEvent,
  PumpfunEvent,
  PumpfunTradeEvent,
} from "../types";

export class PumpfunEventParser {
  constructor(
    private readonly txWithMeta: ParsedTransactionWithMeta,
    private readonly dexInfo?: DexInfo,
  ) {}

  public processEvents(): PumpfunEvent[] {
    return this.txWithMeta.transaction.message.instructions.reduce(
      (events: PumpfunEvent[], instruction: any, index: number) => {
        if (instruction.programId.toBase58() === DEX_PROGRAMS.PUMP_FUN.id) {
          events.push(...this.parseInnerInstructions(index));
        }
        return events;
      },
      [],
    );
  }

  public parseInnerInstructions(instructionIndex: number): PumpfunEvent[] {
    const innerInstructions = this.txWithMeta.meta?.innerInstructions;
    if (!innerInstructions) return [];

    const txMeta = {
      slot: this.txWithMeta.slot,
      timestamp: this.txWithMeta.blockTime || 0,
      signature: this.txWithMeta.transaction.signatures[0],
    };
    return innerInstructions
      .filter((set) => set.index === instructionIndex)
      .flatMap((set) =>
        set.instructions
          .flatMap((ix, idx: number) => {
            const events: PumpfunEvent[] = [];
            if (this.isPumpFunCreateEvent(ix as PartiallyDecodedInstruction)) {
              const event = this.parseCreateEvent(
                ix as PartiallyDecodedInstruction,
              );
              if (event) {
                events.push({
                  type: "CREATE",
                  data: event,
                  ...txMeta,
                  idx: `${instructionIndex}-${idx}`,
                });
              }
            }
            if (this.isPumpFunTradeEvent(ix as PartiallyDecodedInstruction)) {
              const event = this.parseTradeEvent(
                ix as PartiallyDecodedInstruction,
              );
              if (event) {
                events.push({
                  type: "TRADE",
                  data: event,
                  ...txMeta,
                  idx: `${instructionIndex}-${idx}`,
                });
              }
            }

            if (
              this.isPumpFunCompleteEvent(ix as PartiallyDecodedInstruction)
            ) {
              const event = this.parseCompleteEvent(
                ix as PartiallyDecodedInstruction,
              );
              if (event) {
                events.push({
                  type: "COMPLETE",
                  data: event,
                  ...txMeta,
                  idx: `${instructionIndex}-${idx}`,
                });
              }
            }
            return events;
          })
          .filter((event) => event !== null),
      );
  }

  private isPumpFunTradeEvent(
    instruction: PartiallyDecodedInstruction,
  ): boolean {
    try {
      if (instruction.programId.toBase58() != DEX_PROGRAMS.PUMP_FUN.id)
        return false;
      const data = base58.decode(instruction.data as string);
      return Buffer.from(data.slice(0, 16)).equals(
        DISCRIMINATORS.PUMPFUN.TRADE_EVENT,
      );
    } catch {
      return false;
    }
  }

  private parseTradeEvent(
    instruction: PartiallyDecodedInstruction,
  ): PumpfunTradeEvent | null {
    try {
      const data = base58.decode(instruction.data as string);
      return this.decodeTradeEvent(data.slice(16));
    } catch (error) {
      console.error("Failed to parse PumpFun trade event:", error);
      return null;
    }
  }

  private decodeTradeEvent(data: Buffer): PumpfunTradeEvent {
    const reader = new BinaryReader(data);

    return {
      mint: base58.encode(reader.readFixedArray(32)),
      solAmount: convertToUiAmount(reader.readU64()),
      tokenAmount: convertToUiAmount(reader.readU64(), 6),
      isBuy: reader.readU8() === 1,
      user: base58.encode(reader.readFixedArray(32)),
      timestamp: reader.readI64(),
      virtualSolReserves: convertToUiAmount(reader.readU64()),
      virtualTokenReserves: convertToUiAmount(reader.readU64(), 6),
    };
  }

  private isPumpFunCreateEvent(
    instruction: PartiallyDecodedInstruction,
  ): boolean {
    try {
      if (instruction.programId.toBase58() != DEX_PROGRAMS.PUMP_FUN.id)
        return false;
      const data = base58.decode(instruction.data as string);
      return Buffer.from(data.slice(0, 16)).equals(
        DISCRIMINATORS.PUMPFUN.CREATE_EVENT,
      );
    } catch {
      return false;
    }
  }

  private parseCreateEvent(
    instruction: PartiallyDecodedInstruction,
  ): PumpfunCreateEvent | null {
    try {
      const data = base58.decode(instruction.data as string);
      return this.decodeCreateEvent(data.slice(16));
    } catch (error) {
      console.error("Failed to parse PumpFun create event:", error);
      return null;
    }
  }

  private decodeCreateEvent(data: Buffer): PumpfunCreateEvent {
    const reader = new BinaryReader(data);
    return {
      name: reader.readString(),
      symbol: reader.readString(),
      uri: reader.readString(),
      mint: base58.encode(reader.readFixedArray(32)),
      bondingCurve: base58.encode(reader.readFixedArray(32)),
      user: base58.encode(reader.readFixedArray(32)),
    };
  }

  private isPumpFunCompleteEvent(
    instruction: PartiallyDecodedInstruction,
  ): boolean {
    try {
      if (instruction.programId.toBase58() != DEX_PROGRAMS.PUMP_FUN.id)
        return false;
      const data = base58.decode(instruction.data as string);
      return Buffer.from(data.slice(0, 16)).equals(
        DISCRIMINATORS.PUMPFUN.COMPLETE_EVENT,
      );
    } catch {
      return false;
    }
  }

  private parseCompleteEvent(
    instruction: PartiallyDecodedInstruction,
  ): PumpfunCompleteEvent | null {
    try {
      const data = base58.decode(instruction.data as string);
      return this.decodeCompleteEvent(data.slice(16));
    } catch (error) {
      console.error("Failed to parse PumpFun complete event:", error);
      return null;
    }
  }

  private decodeCompleteEvent(data: Buffer): PumpfunCompleteEvent {
    const reader = new BinaryReader(data);
    return {
      user: base58.encode(reader.readFixedArray(32)),
      mint: base58.encode(reader.readFixedArray(32)),
      bondingCurve: base58.encode(reader.readFixedArray(32)),
      timestamp: reader.readI64(),
    };
  }
}

export class BinaryReader {
  private offset = 0;

  constructor(private buffer: Buffer) {}

  readFixedArray(length: number): Buffer {
    this.checkBounds(length);
    const array = this.buffer.slice(this.offset, this.offset + length);
    this.offset += length;
    return array;
  }

  readU8(): number {
    this.checkBounds(1);
    const value = this.buffer.readUInt8(this.offset);
    this.offset += 1;
    return value;
  }

  readU64(): bigint {
    this.checkBounds(8);
    const value = this.buffer.readBigUInt64LE(this.offset);
    this.offset += 8;
    return value;
  }

  readI64(): bigint {
    this.checkBounds(8);
    const value = this.buffer.readBigInt64LE(this.offset);
    this.offset += 8;
    return value;
  }

  readString(): string {
    // Read 4-byte (32-bit) length instead of 1 byte
    const length = this.buffer.readUInt32LE(this.offset);
    this.offset += 4;

    this.checkBounds(length);
    const strBuffer = this.buffer.slice(this.offset, this.offset + length);
    const content = strBuffer.toString("utf8");
    this.offset += length;

    return content;
  }

  private checkBounds(length: number) {
    if (this.offset + length > this.buffer.length) {
      throw new Error(
        `Buffer overflow: trying to read ${length} bytes at offset ${this.offset} in buffer of length ${this.buffer.length}`,
      );
    }
  }

  getOffset(): number {
    return this.offset;
  }
}
