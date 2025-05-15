import { Connection } from '@solana/web3.js';
import dotenv from 'dotenv';
import { DexParser } from '../dex-parser';
import { getFinalSwap } from '../utils';
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

    [
      // "2dpTLk6AQQMJUAdhNz3dK8guEDBfR3vogUkgHwDg9praDxthgsz5cAYCL4WHrnKuAWBMG3VNquSJ3W9RNbv1pVoo",
      "4k5fiYG5na7842EB8VMntHX2uQyKecWf19We8bmcefrWQ1G9oXwuP8VUbXpBqy4t5NipLTxhQNrqa66BGSftjpUE",
      // "4WGyuUf65j9ojW6zrKf9zBEQsEfW5WiuKjdh6K2dxQAn7ggMkmT1cn1v9GuFs3Ew1d7oMJGh2z1VNvwdLQqJoC9s" // transfer
    ]
      .forEach((signature) => {
        it(`${signature} `, async () => {
          const tx = await connection.getTransaction(signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0,
          });
          if (!tx) { throw new Error(`Transaction not found > ${signature}`); }
          const { fee, trades, liquidities, transfers } = parser.parseAll(tx);
          // fs.writeFileSync(`./src/__tests__/tx-${signature}.json`, JSON.stringify(tx, null, 2));
          const swap = getFinalSwap(trades);
          console.log('fee', fee);
          console.log('finalSwap', JSON.stringify(swap, null, 2));
          console.log('trades', trades);
          console.log('liquidity', liquidities);
          console.log('transfer', JSON.stringify(transfers, null, 2));

          expect(trades.length + liquidities.length + transfers.length).toBeGreaterThanOrEqual(1);
        });
      });
  });
});
