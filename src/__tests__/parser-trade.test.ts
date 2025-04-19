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
      "fLnFypCuyAtv2MCyhSadg4qZdHjyUW3m56Kvp9skK9tnCke5PFwoYNYYaKp2wNLw6pqEDt3JPpuBY2LNK4ejhxm",
      // "125MRda3h1pwGZpPRwSRdesTPiETaKvy4gdiizyc3SWAik4cECqKGw2gggwyA1sb2uekQVkupA2X9S4vKjbstxx3",
      // "4WGyuUf65j9ojW6zrKf9zBEQsEfW5WiuKjdh6K2dxQAn7ggMkmT1cn1v9GuFs3Ew1d7oMJGh2z1VNvwdLQqJoC9s" // transfer
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
          const swap = getFinalSwap(trades);
          console.log('finalSwap', swap);
          console.log('trades', trades);
          console.log('liquidity', liquidities);
          console.log('transfer', transfers);

          expect(trades.length + liquidities.length + transfers.length).toBeGreaterThanOrEqual(1);
        });
      });
  });
});
