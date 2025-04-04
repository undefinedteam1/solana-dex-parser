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

    ["ucr3MkTsdSqTbkTcgLHFRK3dsPPX4t6FG1KNZatMz5vCvE3UCBCR51VZq9YThRkvZdj471WmmiL3JHu62YFmbBR",
    ]
      .forEach((signature) => {
        it(`${signature} `, async () => {
          const tx = await connection.getTransaction(signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0,
          });
          if (!tx) { throw new Error(`Transaction not found > ${signature}`); }
          const { trades, liquidities } = parser.parseAll(tx, { tryUnknowDEX: false });
          console.log('trades', trades);
          console.log('liquidity', liquidities);
          expect(trades.length + liquidities.length).toBeGreaterThanOrEqual(1);
        });
      });
  });
});
