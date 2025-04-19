import { PoolEvent } from './pool';
import { TradeInfo, TransferData } from './trade';

export interface ClassifiedInstruction {
  instruction: any;
  programId: string;
  outerIndex: number;
  innerIndex?: number;
}

export interface ParseResult {
  state: boolean;
  trades: TradeInfo[];
  liquidities: PoolEvent[];
  transfers: TransferData[];
  msg?: string;
}

export type EventParser<T> = {
  discriminator: Buffer | Uint8Array;
  decode: (data: Buffer) => T;
};

export type EventsParser<T> = {
  discriminators: (Buffer | Uint8Array)[];
  slice: number;
  decode: (data: Buffer, options: any) => T;
};
