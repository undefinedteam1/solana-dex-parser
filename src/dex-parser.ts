import { Connection } from '@solana/web3.js';
import { DEX_PROGRAMS } from './constants';
import { SolanaTransaction, TransferData, DexInfo, ParseConfig, PoolEvent, TradeInfo } from './types';
import { getProgramName } from './utils';
import { MoonshotParser, MeteoraParser, PumpfunParser, RaydiumParser, OrcaParser, JupiterParser } from './parsers';
import { RaydiumLiquidityParser } from './parsers/parser-raydium-liquidity';
import { MeteoraLiquidityParser } from './parsers/parser-meteora-liquidity';
import { OrcaLiquidityParser } from './parsers/parser-orca-liquidity';
import { TransactionAdapter } from './transaction-adapter';
import { TransactionUtils } from './transaction-utils';

/**
 * Interface for DEX trade parsers
 * Defines the structure that all DEX parsers must implement
 */
type ParserConstructor = new (
  adapter: TransactionAdapter,
  dexInfo: DexInfo,
  transferActions: Record<string, TransferData[]>
) => {
  processTrades(): TradeInfo[];
  parseTransferAction?(transfer: [string, TransferData[]]): TradeInfo[];
};

/**
 * Interface for liquidity pool parsers
 * Defines the structure that all liquidity parsers must implement
 */
type ParserLiquidityConstructor = new (adapter: TransactionAdapter) => {
  processLiquidity(): PoolEvent[];
};

/**
 * Main parser class for Solana DEX transactions
 * Handles parsing of trades and liquidity pool events
 */
export class DexParser {
  /**
   * Mapping of DEX program IDs to their corresponding trade parsers
   * Each parser is responsible for handling specific DEX protocol transactions
   */
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

  /**
   * Mapping of DEX program IDs to their corresponding liquidity parsers
   * Each parser handles liquidity pool events for specific DEX protocols
   */
  private readonly parseLiquidityMap: Record<string, ParserLiquidityConstructor> = {
    [DEX_PROGRAMS.METEORA.id]: MeteoraLiquidityParser,
    [DEX_PROGRAMS.METEORA_POOLS.id]: MeteoraLiquidityParser,
    [DEX_PROGRAMS.RAYDIUM_V4.id]: RaydiumLiquidityParser,
    [DEX_PROGRAMS.RAYDIUM_CPMM.id]: RaydiumLiquidityParser,
    [DEX_PROGRAMS.RAYDIUM_CL.id]: RaydiumLiquidityParser,
    [DEX_PROGRAMS.ORCA.id]: OrcaLiquidityParser,
  };

  /**
   * Creates a new DexParser instance
   * @param connection Optional Solana RPC connection for fetching transactions
   */
  constructor(private connection?: Connection) {}

  /**
   * Fetches and parses a transaction by its signature
   * @param signature Transaction signature to fetch and parse
   * @param config Optional configuration for parsing behavior
   * @returns Array of parsed trade information
   * @throws Error if connection is not provided or transaction cannot be fetched
   */
  public async parseTransaction(signature: string, config?: ParseConfig): Promise<TradeInfo[]> {
    if (!this.connection) throw `Connection required!`;
    const tx = await this.connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });
    if (!tx) throw `Can't fetch transaction! ${signature}`;
    return this.parseTrades(tx as SolanaTransaction, config);
  }

  /**
   * Parses trades from a transaction
   * @param tx Transaction to parse
   * @param config Optional configuration for parsing behavior
   * @returns Array of parsed trade information
   */
  public parseTrades(tx: SolanaTransaction, config: ParseConfig = { tryUnknowDEX: true }): TradeInfo[] {
    const trades: TradeInfo[] = [];

    try {
      const adapter = new TransactionAdapter(tx);
      const utils = new TransactionUtils(adapter);

      // Get DEX information and validate
      const dexInfo = utils.getDexInfo();
      if (!dexInfo.programId) return [];
      if (config?.programIds && !config.programIds.includes(dexInfo.programId)) return [];

      const transferActions = utils.getTransferActions();

      // Try specific parser first
      const ParserClass = this.parserMap[dexInfo.programId];
      if (ParserClass) {
        const parser = new ParserClass(adapter, dexInfo, transferActions);
        trades.push(...parser.processTrades());
      }

      // Try generic parsing if no trades found
      if (trades.length === 0) {
        Object.entries(transferActions).forEach((transfer) => {
          const [key, transfers] = transfer;
          const programId = key.split(':')[0];

          const ParserClass = this.parserMap[programId];
          if (ParserClass) {
            const parser = new ParserClass(
              adapter,
              { ...dexInfo, amm: dexInfo.amm || getProgramName(programId) },
              transferActions
            );
            if (parser.parseTransferAction) {
              trades.push(...parser.parseTransferAction(transfer));
            }
          } else if (transfers.length >= 2) {
            // Handle unknown DEX programs
            if (Object.values(DEX_PROGRAMS).some((it) => it.id === programId) || config?.tryUnknowDEX) {
              const trade = utils.processSwapData(transfers, {
                ...dexInfo,
                amm: dexInfo.amm || getProgramName(programId),
              });
              if (trade) trades.push(trade);
            }
          }
        });
      }
    } catch (error) {
      console.error('parseTrades error!', error);
    }

    // Return unique trades based on idx and signature
    return [...new Map(trades.map((item) => [`${item.idx}-${item.signature}`, item])).values()];
  }

  /**
   * Parses liquidity pool events from a transaction
   * @param tx Transaction to parse
   * @returns Array of parsed pool events
   */
  public parseLiquidity(tx: SolanaTransaction): PoolEvent[] {
    const events: PoolEvent[] = [];

    try {
      const adapter = new TransactionAdapter(tx);
      const utils = new TransactionUtils(adapter);

      const dexInfo = utils.getDexInfo();
      if (!dexInfo.programId) return [];

      const ParserLiquidityClass = this.parseLiquidityMap[dexInfo.programId];
      if (ParserLiquidityClass) {
        const parser = new ParserLiquidityClass(adapter);
        events.push(...parser.processLiquidity());
      }
    } catch (error) {
      console.error('parseLiquidity error!', error);
    }

    return events;
  }
}
