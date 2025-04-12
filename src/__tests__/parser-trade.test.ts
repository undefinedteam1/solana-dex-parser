import { Connection } from '@solana/web3.js';
import dotenv from 'dotenv';
import { DexParser } from '../dex-parser';
import { DEX_PROGRAMS } from '../constants';

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

    ["648cwSysqKXnb3XLPy577Lu4oBk7jimaY8p95JGfS9QUNabYar5pzfcRdu518TWw3dbopquJnMne9qx22xuf8xqn",
    ]
      .forEach((signature) => {
        it(`${signature} `, async () => {
          const tx = await connection.getTransaction(signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0,
          });
          if (!tx) { throw new Error(`Transaction not found > ${signature}`); }
          const { trades, liquidities, transfers } = parser.parseAll(tx,
            {
              tryUnknowDEX: false,
              // programIds: [DEX_PROGRAMS.PUMP_FUN.id, DEX_PROGRAMS.PUMP_SWAP.id]
            });
          console.log('trades', trades);
          console.log('liquidity', liquidities);
          console.log('transfer', transfers);

          expect(trades.length + liquidities.length + transfers.length).toBeGreaterThanOrEqual(1);
        });
      });
  });
});
