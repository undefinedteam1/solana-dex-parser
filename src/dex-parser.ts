import { Connection, ParsedTransactionWithMeta } from '@solana/web3.js';
import { DEX_PROGRAMS } from './constants';
import { DexInfo, ParseConfig, PoolEvent, TokenInfo, TradeInfo, TransferData } from './types';
import { getDexInfo, getProgramName } from './utils';
import { MoonshotParser, MeteoraParser, PumpfunParser, RaydiumParser, OrcaParser, JupiterParser } from './parsers';
import { RaydiumLiquidityParser } from './parsers/parser-raydium-liquidity';
import { MeteoraLiquidityParser } from './parsers/parser-meteora-liquidity';
import { OrcaLiquidityParser } from './parsers/parser-orca-liquidity';
import { TokenInfoExtractor } from './token-extractor';
import { getTransferActions, processSwapData } from './transfer-utils';

type ParserConstructor = new (
  tx: ParsedTransactionWithMeta,
  dexInfo: DexInfo,
  splTokenMap: Map<string, TokenInfo>,
  splDecimalsMap: Map<string, number>,
  transferActions: Record<string, TransferData[]>
) => {
  processTrades(): TradeInfo[];
  parseTransferAction?(transfer: [string, TransferData[]]): TradeInfo[];
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
    [DEX_PROGRAMS.RAYDIUM_ROUTE.id]: RaydiumParser,
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

    const tokenExtractor = new TokenInfoExtractor(tx);
    const splTokenMap = tokenExtractor.extractSPLTokenInfo();
    const splDecimalsMap = tokenExtractor.extractDecimals();
    const transferActions = getTransferActions(tx, splTokenMap, splDecimalsMap);

    const trades: TradeInfo[] = [];
    const ParserClass = this.parserMap[dexInfo.programId];
    if (ParserClass) {
      const parser = new ParserClass(tx, dexInfo, splTokenMap, splDecimalsMap, transferActions); // Special protocols, Router Dex and Bots
      trades.push(...parser.processTrades());
    }

    if (trades.length == 0) {
      Object.entries(transferActions).forEach((transfer) => {
        if (transfer[1].length >= 2) {
          const programId = transfer[0].split(':')[0];
          const ParserClass = this.parserMap[programId];
          if (ParserClass) {
            const parser = new ParserClass(
              tx,
              { ...dexInfo, amm: dexInfo.amm || getProgramName(programId) },
              splTokenMap,
              splDecimalsMap,
              transferActions
            );
            if (parser.parseTransferAction) {
              trades.push(...parser.parseTransferAction(transfer));
            }
          } else {
            if (Object.values(DEX_PROGRAMS).some((it) => it.id == programId) || config?.tryUnknowDEX == true) {
              const trade = processSwapData(tx, transfer[1], {
                ...dexInfo,
                amm: dexInfo.amm || getProgramName(programId),
              });
              if (trade) {
                trades.push(trade);
              }
            }
          }
        }
      });
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
}
