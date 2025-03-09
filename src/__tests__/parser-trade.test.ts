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

    ["5QWYBSJReisnxHNpPpwLDXyvMV9ehajk15aTSPzjV7PvhvDSXPWW4btQyUUDeWvRteF1Vg7CkazHngtSaXAvThVE"
      // "2XYu86VrUXiwNNj8WvngcXGytrCsSrpay69Rt3XBz9YZvCQcZJLjvDfh9UWETFtFW47vi4xG2CkiarRJwSe6VekE",
      // "7YPF21r7JBDeoXuMJn6KSqDVYGrm821U87Cnje3xPvZpMUVaAEAvCGJPP6va2b5oMLAzGku5s3TcNAsN6zdXPRn"
    ]
      .forEach((signature) => {
        it(`${signature} `, async () => {

          const tx = await connection.getTransaction(signature, {
            commitment: 'finalized',
            maxSupportedTransactionVersion: 0,
          });
   
          if (!tx) { throw new Error(`Transaction not found > ${signature}`); }
          // console.log('accountKeys', tx.transaction.message.accountKeys.length, tx.transaction.message.accountKeys.map((it)=>it.pubkey.toBase58()));
          // const keys = tx.transaction.message.staticAccountKeys.map((it)=>it.toBase58()) || [];
          // const key2 = tx.meta?.loadedAddresses?.writable.map((it)=>it.toBase58()) || [];
          // const key3 = tx.meta?.loadedAddresses?.readonly.map((it)=>it.toBase58()) || [];
          // console.log(keys.length, '>>', key2?.length, '>>', key3?.length);
          // console.log([...keys, ...key2, ...key3]);
          const trades = parser.parseTrades(tx as any);
          const liquidity = parser.parseLiquidity(tx as any);
          console.log('trades', trades, '> liquidity', liquidity);
          expect(trades.length).toBeGreaterThanOrEqual(1);

        });
      });
  });
});
