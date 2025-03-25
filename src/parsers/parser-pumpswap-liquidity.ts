import { DEX_PROGRAMS } from '../constants';
import {
  convertToUiAmount,
  PoolEvent,
  PumpswapCreatePoolEvent,
  PumpswapDepositEvent,
  PumpswapEvent,
  PumpswapWithdrawEvent,
} from '../types';
import { PumpswapEventParser } from './parser-pumpswap-event';
import { TransactionAdapter } from '../transaction-adapter';

export class PumpswapLiquidityParser {
  private eventParser: PumpswapEventParser;

  constructor(private readonly adapter: TransactionAdapter) {
    this.eventParser = new PumpswapEventParser(this.adapter);
  }

  public processLiquidity(): PoolEvent[] {
    const events = this.eventParser.processEvents().filter((it) => ['CREATE', 'ADD', 'REMOVE'].includes(it.type));
    return events.length > 0 ? this.parseLiquidityEvents(events) : [];
  }

  private parseLiquidityEvents(events: PumpswapEvent[]): PoolEvent[] {
    if (!events.length) return [];
    return events
      .map((event) => {
        switch (event.type) {
          case 'CREATE':
            return this.parseCreateEvent(event);
          case 'ADD':
            return this.parseDepositEvent(event);
          case 'REMOVE':
            return this.parseWithdrawEvent(event);
          default:
            return null;
        }
      })
      .filter((it) => it != null);
  }

  private parseCreateEvent(data: PumpswapEvent): PoolEvent {
    const event = data.data as PumpswapCreatePoolEvent;

    return {
      ...this.adapter.getPoolEventBase('CREATE', DEX_PROGRAMS.PUMP_SWAP.id),
      idx: data.idx,
      poolId: event.pool,
      poolLpMint: event.lpMint,
      token0Mint: event.baseMint,
      token1Mint: event.quoteMint,
      token0Amount: convertToUiAmount(event.baseAmountIn, event.baseMintDecimals),
      token1Amount: convertToUiAmount(event.quoteAmountIn, event.quoteMintDecimals),
    };
  }

  private parseDepositEvent(data: PumpswapEvent): PoolEvent {
    const event = data.data as PumpswapDepositEvent;
    const token0Mint = this.adapter.splTokenMap.get(event.userBaseTokenAccount)!.mint;
    const token0Decimal = this.adapter.getTokenDecimals(token0Mint);
    const token1Mint = this.adapter.splTokenMap.get(event.userQuoteTokenAccount)!.mint;
    const token1Decimal = this.adapter.getTokenDecimals(token1Mint);
    return {
      ...this.adapter.getPoolEventBase('ADD', DEX_PROGRAMS.PUMP_SWAP.id),
      idx: data.idx,
      poolId: event.pool,
      poolLpMint: this.adapter.splTokenMap.get(event.userPoolTokenAccount)!.mint,
      token0Mint: token0Mint,
      token1Mint: token1Mint,
      token0Amount: convertToUiAmount(event.baseAmountIn, token0Decimal),
      token1Amount: convertToUiAmount(event.quoteAmountIn, token1Decimal),
    };
  }

  private parseWithdrawEvent(data: PumpswapEvent): PoolEvent {
    const event = data.data as PumpswapWithdrawEvent;
    const token0Mint = this.adapter.splTokenMap.get(event.userBaseTokenAccount)!.mint;
    const token0Decimal = this.adapter.getTokenDecimals(token0Mint);
    const token1Mint = this.adapter.splTokenMap.get(event.userQuoteTokenAccount)!.mint;
    const token1Decimal = this.adapter.getTokenDecimals(token1Mint);
    return {
      ...this.adapter.getPoolEventBase('REMOVE', DEX_PROGRAMS.PUMP_SWAP.id),
      idx: data.idx,
      poolId: event.pool,
      poolLpMint: this.adapter.splTokenMap.get(event.userPoolTokenAccount)!.mint,
      token0Mint: token0Mint,
      token1Mint: token1Mint,
      token0Amount: convertToUiAmount(event.baseAmountOut, token0Decimal),
      token1Amount: convertToUiAmount(event.quoteAmountOut, token1Decimal),
    };
  }
}
