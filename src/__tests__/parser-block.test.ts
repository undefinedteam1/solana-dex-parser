import { Connection } from '@solana/web3.js';
import dotenv from 'dotenv';
import { DexParser } from '../dex-parser';
import * as https from 'node:https';

dotenv.config();

describe('Parser', () => {
  let connection: Connection;
  beforeAll(async () => {
    // Initialize connection
    const rpcUrl = process.env.SOLANA_RPC_URL;
    if (!rpcUrl) {
      throw new Error('SOLANA_RPC_URL environment variable is not set');
    }
    connection = new Connection(rpcUrl, { commitment: 'confirmed', httpAgent: new https.Agent({ host: '127.0.0.1', port: 7890 }) });
  });

  describe('Dex', () => {

    describe('parseTransaction', () => {
      it("block", async () => {
        const parser = new DexParser(connection);

        // const trades = await parser.parseTransaction(signature);
        const s1 = Date.now();
        const block = await connection.getParsedBlock(323648209, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
          transactionDetails: 'full',
        })
        const s2 = Date.now();
        if (!block) {
          throw new Error("Block not found");
        }
        const ts: any[] = [], liqs: any[] = [];
        console.log(block.transactions[0]);
        block.transactions.forEach((tx) => {
          if (tx.meta?.err) {
            return;
          }
          const trades = parser.parseTrades({ ...tx!, slot: (block.parentSlot + 1), blockTime: block.blockTime } as any);
          const ls = parser.parseLiquidity({ ...tx!, slot: (block.parentSlot + 1), blockTime: block.blockTime } as any);
          ts.push(...trades);
          liqs.push(...ls);
        })
        const s3 = Date.now();

        // console.log("Trades:", ts);
        // console.log("Liquidity:", liqs);
        console.log(`Fetch block: ${(s2 - s1) / 1000} s > Parser: ${(s3 - s2) / 1000} s > Hits: ${ts.length + liqs.length} / ${block.transactions.length}`);

      });
    });
  });
});
