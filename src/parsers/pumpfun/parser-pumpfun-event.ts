import base58 from 'bs58';
import { Buffer } from 'buffer';
import { DEX_PROGRAMS, DISCRIMINATORS } from '../../constants';
import { InstructionClassifier } from '../../instruction-classifier';
import { TransactionAdapter } from '../../transaction-adapter';
import {
  ClassifiedInstruction,
  EventParser,
  PumpfunCompleteEvent,
  PumpfunCreateEvent,
  PumpfunEvent,
  PumpfunTradeEvent,
} from '../../types';
import { getInstructionData } from '../../utils';

export class PumpfunEventParser {
  constructor(private readonly adapter: TransactionAdapter) {}

  private readonly eventParsers: Record<string, EventParser<any>> = {
    TRADE: {
      discriminator: DISCRIMINATORS.PUMPFUN.TRADE_EVENT,
      decode: this.decodeTradeEvent.bind(this),
    },
    CREATE: {
      discriminator: DISCRIMINATORS.PUMPFUN.CREATE_EVENT,
      decode: this.decodeCreateEvent.bind(this),
    },
    COMPLETE: {
      discriminator: DISCRIMINATORS.PUMPFUN.COMPLETE_EVENT,
      decode: this.decodeCompleteEvent.bind(this),
    },
  };

  public processEvents(): PumpfunEvent[] {
    const instructions = new InstructionClassifier(this.adapter).getInstructions(DEX_PROGRAMS.PUMP_FUN.id);
    return this.parseInstructions(instructions);
  }

  public parseInstructions(instructions: ClassifiedInstruction[]): PumpfunEvent[] {
    return instructions
      .map(({ instruction, outerIndex, innerIndex }) => {
        try {
          const data = getInstructionData(instruction);
          const discriminator = Buffer.from(data.slice(0, 16));

          for (const [type, parser] of Object.entries(this.eventParsers)) {
            if (discriminator.equals(parser.discriminator)) {
              const eventData = parser.decode(data.slice(16));
              if (!eventData) return null;

              return {
                type: type as 'TRADE' | 'CREATE' | 'COMPLETE',
                data: eventData,
                slot: this.adapter.slot,
                timestamp: this.adapter.blockTime || 0,
                signature: this.adapter.signature,
                idx: `${outerIndex}-${innerIndex ?? 0}`,
              };
            }
          }
        } catch (error) {
          console.error('Failed to parse Pumpfun event:', error);
        }
        return null;
      })
      .filter((event): event is PumpfunEvent => event !== null);
  }

  private decodeTradeEvent(data: Buffer): PumpfunTradeEvent {
    const reader = new BinaryReader(data);

    return {
      mint: base58.encode(Buffer.from(reader.readFixedArray(32))),
      solAmount: reader.readU64(),
      tokenAmount: reader.readU64(),
      isBuy: reader.readU8() === 1,
      user: base58.encode(reader.readFixedArray(32)),
      timestamp: reader.readI64(),
      virtualSolReserves: reader.readU64(),
      virtualTokenReserves: reader.readU64(),
    };
  }

  private decodeCreateEvent(data: Buffer): PumpfunCreateEvent {
    const reader = new BinaryReader(data);
    return {
      name: reader.readString(),
      symbol: reader.readString(),
      uri: reader.readString(),
      mint: base58.encode(Buffer.from(reader.readFixedArray(32))),
      bondingCurve: base58.encode(reader.readFixedArray(32)),
      user: base58.encode(reader.readFixedArray(32)),
    };
  }

  private decodeCompleteEvent(data: Buffer): PumpfunCompleteEvent {
    const reader = new BinaryReader(data);
    return {
      user: base58.encode(reader.readFixedArray(32)),
      mint: base58.encode(Buffer.from(reader.readFixedArray(32))),
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

  readU16(): number {
    this.checkBounds(2);
    const value = this.buffer.readUint16LE(this.offset);
    this.offset += 2;
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
    const content = strBuffer.toString('utf8');
    this.offset += length;

    return content;
  }

  readPubkey(): string {
    return base58.encode(Buffer.from(this.readFixedArray(32)));
  }

  private checkBounds(length: number) {
    if (this.offset + length > this.buffer.length) {
      throw new Error(
        `Buffer overflow: trying to read ${length} bytes at offset ${this.offset} in buffer of length ${this.buffer.length}`
      );
    }
  }

  getOffset(): number {
    return this.offset;
  }
}
