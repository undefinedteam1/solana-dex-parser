import { Connection } from '@solana/web3.js';
import dotenv from 'dotenv';
import { DexParser } from '../dex-parser';

dotenv.config();

describe('Parser', () => {
  let connection: Connection;
  beforeAll(async () => {
    // Initialize connection
    const rpcUrl = process.env.SOLANA_RPC_URL;
    if (!rpcUrl) {
      throw new Error('SOLANA_RPC_URL environment variable is not set');
    }
    connection = new Connection(rpcUrl, { 
      commitment: 'confirmed',
     });
  });

  describe('Dex', () => {

    describe('parseTransaction', () => {
      it("block", async () => {
        const parser = new DexParser();

        const s1 = Date.now();
        const block = await connection.getBlock(330422352, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
          transactionDetails: 'full',
        })
        const s2 = Date.now();
        if (!block) {
          throw new Error("Block not found");
        }
        const ts: any[] = [], liqs: any[] = [];
        // console.log(block.transactions[0]);
        block.transactions.forEach((tx) => {
          if (tx.meta?.err) {
            return;
          }
          const {trades,liquidities} = parser.parseAll({ ...tx!, slot: (block.parentSlot + 1), blockTime: block.blockTime } as any, { tryUnknowDEX: false});
         
          ts.push(...trades);
          liqs.push(...liquidities);
        })
        const s3 = Date.now();

        console.log(`Fetch block: ${(s2 - s1) / 1000} s > Parser: ${(s3 - s2) / 1000} s > Hits: ${ts.length + liqs.length} / ${block.transactions.length}`);

      });
    });
  });
});
