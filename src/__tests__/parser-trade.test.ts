import { Connection } from '@solana/web3.js';
import dotenv from 'dotenv';
import { DexParser } from '../dex-parser';

dotenv.config();


describe('Dex Parser', () => {
  let connection: Connection;
  beforeAll(async () => {
    // Initialize connection
    const rpcUrl = process.env.SOLANA_RPC_URL;
    if (!rpcUrl) {
      throw new Error('SOLANA_RPC_URL environment variable is not set');
    }
    connection = new Connection(rpcUrl, {
      commitment: 'confirmed',
      // httpAgent: new https.Agent({ host: '127.0.0.1', port: 7890 }) 
    });
  });

  describe('Parse Trades', () => {
    const parser = new DexParser();

    ["23ACnYkaTqpHDvSJkhwqFb72KUXUjL4Bd8kwLNyRS1nzjxMxjrBnp7A5Gfogr9typ8imsckGfqWrCNhJg68MDsyL"
    ]
      .forEach((signature) => {
        it(`${signature} `, async () => {
          const tx = await connection.getTransaction(signature, {
            commitment: 'finalized',
            maxSupportedTransactionVersion: 0,
          });
          if (!tx) { throw new Error(`Transaction not found > ${signature}`); }
          const trades = parser.parseTrades(tx, { tryUnknowDEX: false});
          const liquidity = parser.parseLiquidity(tx as any);
          console.log('trades', trades, '> liquidity', liquidity);
          expect(trades.length).toBeGreaterThanOrEqual(1);
        });
      });
  });
});
