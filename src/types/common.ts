import { PoolEvent } from './pool';
import { TradeInfo } from './trade';

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
  msg?: string;
}

export type EventParser<T> = {
  discriminator: Buffer | Uint8Array;
  decode: (data: Buffer) => T;
};
