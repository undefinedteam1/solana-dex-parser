import { Connection, ParsedTransactionWithMeta } from '@solana/web3.js';
import { DEX_PROGRAMS } from './constants';
import { DexInfo, ParseConfig, PoolEvent, TradeInfo } from './types';
import { getDexInfo } from './utils';
import {
  MoonshotParser,
  MeteoraParser,
  PumpfunParser,
  DefaultParser,
  RaydiumParser,
  OrcaParser,
  JupiterParser,
} from './parsers';
import { RaydiumLiquidityParser } from './parsers/parser-raydium-liquidity';
import { MeteoraLiquidityParser } from './parsers/parser-meteora-liquidity';
import { OrcaLiquidityParser } from './parsers/parser-orca-liquidity';

type ParserConstructor = new (
  tx: ParsedTransactionWithMeta,
  dexInfo: DexInfo
) => {
  processTrades(): TradeInfo[];
  processInstructionTrades?(index: number): TradeInfo[];
  isTradeInstruction(instruction: any): boolean;
};

type ParserLiquidityConstructor = new (tx: ParsedTransactionWithMeta) => {
  processLiquidity(): PoolEvent[];
};

export class DexParser {
  private readonly parserMap: Record<string, ParserConstructor> = {
    [DEX_PROGRAMS.JUPITER.id]: JupiterParser,
    [DEX_PROGRAMS.JUPITER_DCA.id]: JupiterParser,
    [DEX_PROGRAMS.MOONSHOT.id]: MoonshotParser,
    [DEX_PROGRAMS.METEORA.id]: MeteoraParser,
    [DEX_PROGRAMS.METEORA_POOLS.id]: MeteoraParser,
    [DEX_PROGRAMS.PUMP_FUN.id]: PumpfunParser,
    [DEX_PROGRAMS.RAYDIUM_AMM.id]: RaydiumParser,
    [DEX_PROGRAMS.RAYDIUM_CL.id]: RaydiumParser,
    [DEX_PROGRAMS.RAYDIUM_CPMM.id]: RaydiumParser,
    [DEX_PROGRAMS.RAYDIUM_V4.id]: RaydiumParser,
    [DEX_PROGRAMS.ORCA.id]: OrcaParser,
  };

  private readonly parseLiquidityMap: Record<string, ParserLiquidityConstructor> = {
    [DEX_PROGRAMS.METEORA.id]: MeteoraLiquidityParser,
    [DEX_PROGRAMS.METEORA_POOLS.id]: MeteoraLiquidityParser,
    [DEX_PROGRAMS.RAYDIUM_V4.id]: RaydiumLiquidityParser,
    [DEX_PROGRAMS.RAYDIUM_CPMM.id]: RaydiumLiquidityParser,
    [DEX_PROGRAMS.RAYDIUM_CL.id]: RaydiumLiquidityParser,
    [DEX_PROGRAMS.ORCA.id]: OrcaLiquidityParser,
  };

  constructor(private connection: Connection) {}

  public async parseTransaction(signature: string, config?: ParseConfig): Promise<TradeInfo[]> {
    const tx = await this.connection.getParsedTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });
    if (!tx) throw `Can't fetch transaction! ${signature}`;
    return this.parseTrades(tx, config);
  }

  public parseTrades(tx: ParsedTransactionWithMeta, config?: ParseConfig): TradeInfo[] {
    const dexInfo = getDexInfo(tx);
    if (!dexInfo.programId) return [];

    if (config?.programIds && !config.programIds.includes(dexInfo.programId)) return [];

    const trades: TradeInfo[] = [];
    const ParserClass = this.parserMap[dexInfo.programId];
    if (ParserClass) {
      const parser = new ParserClass(tx, dexInfo); // Special protocols, Router Dex and Bots
      trades.push(...parser.processTrades());
    }

    if (trades.length == 0) {
      trades.push(...this.parseInstructions(tx, dexInfo, true)); // Inner instructions
    }

    if (trades.length == 0) {
      trades.push(...this.parseInstructions(tx, dexInfo, false)); // Outer instructions
    }

    if (trades.length === 0 && config?.tryUnknowDEX == true) {
      trades.push(...new DefaultParser(tx).parseTradesByBalanceChanges(tx, dexInfo));
    }

    return trades;
  }

  public parseLiquidity(tx: ParsedTransactionWithMeta): PoolEvent[] {
    const dexInfo = getDexInfo(tx);
    if (!dexInfo.programId) return [];

    const events: PoolEvent[] = [];
    const ParserLiquidityClass = this.parseLiquidityMap[dexInfo.programId];
    if (ParserLiquidityClass) {
      const parser = new ParserLiquidityClass(tx);
      events.push(...parser.processLiquidity());
    }
    return events;
  }

  private parseInstructions(tx: ParsedTransactionWithMeta, dexInfo: DexInfo, isInner: boolean): TradeInfo[] {
    const trades: TradeInfo[] = [];
    const processedProtocols = new Set<string>();

    tx.transaction.message.instructions.forEach((instruction: any, index: number) => {
      if (dexInfo.programId !== instruction.programId.toBase58()) return;

      const processInstruction = (programId: string, isInner: boolean) => {
        if (processedProtocols.has(programId)) return;
        processedProtocols.add(programId);

        const ParserClass = this.parserMap[programId];
        if (!ParserClass) return;

        const parser = new ParserClass(tx, dexInfo);
        if (parser.processInstructionTrades) {
          if (isInner || (!isInner && parser.isTradeInstruction && parser.isTradeInstruction(instruction))) {
            trades.push(...parser.processInstructionTrades(index));
          }
        }
      };

      if (isInner) {
        const innerInstructions = tx.meta?.innerInstructions;
        if (!innerInstructions) return;

        innerInstructions
          .filter((set) => set.index === index)
          .forEach((set) => {
            set.instructions.forEach((innerInstruction) => {
              processInstruction(innerInstruction.programId.toBase58(), isInner);
            });
          });
      } else {
        processInstruction(instruction.programId.toBase58(), isInner);
      }
    });

    return trades;
  }
}
