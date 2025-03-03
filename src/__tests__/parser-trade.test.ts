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
    const parser = new DexParser(connection);

    ["648cwSysqKXnb3XLPy577Lu4oBk7jimaY8p95JGfS9QUNabYar5pzfcRdu518TWw3dbopquJnMne9qx22xuf8xqn",
    ]
      .forEach((signature) => {
        it(`${signature} `, async () => {
          const tx = await connection.getParsedTransaction(signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0,
          });
          if (!tx) { throw new Error(`Transaction not found > ${signature}`); }

          const trades = parser.parseTrades(tx);
          // console.log('trades', trades);
          expect(trades.length).toBeGreaterThanOrEqual(1);

        });
      });
  });
});
