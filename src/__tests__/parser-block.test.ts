import { Connection } from '@solana/web3.js';
import dotenv from 'dotenv';
import * as fs from 'fs';
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
        const block = await connection.getBlock(337441395, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
          transactionDetails: 'full',
        })
        const s2 = Date.now();
        if (!block) {
          throw new Error("Block not found");
        }
        const ts: any[] = [], liqs: any[] = [];
        console.log('>>>', block.transactions.length);
        block.transactions.forEach((tx,idx) => {
          // if (tx.meta?.err) {
          //   return;
          // }
          if(idx==1504 || idx==1264) {
            console.log('>K>', tx.transaction.signatures[0]);
            // fs.writeFileSync(`./src/__tests__/tx-${tx.transaction.signatures[0]}.json`, JSON.stringify(tx, null, 2));
          }
          // const { trades, liquidities } = parser.parseAll({ ...tx!, slot: (block.parentSlot + 1), blockTime: block.blockTime } as any, { tryUnknowDEX: false });

          // ts.push(...trades);
          // liqs.push(...liquidities);
        })
        // const s3 = Date.now();

        // console.log(`Fetch block: ${(s2 - s1) / 1000} s > Parser: ${(s3 - s2) / 1000} s > Hits: ${ts.length + liqs.length} / ${block.transactions.length}`);

      });

      // it("json-block", async () => {
      //   const parser = new DexParser();
      //   const data = fs.readFileSync("./src/__tests__/tx-55gZaGoRSov1S9yQE3azRhteZrxwswk9YWW4E7z3XBBaLL9VFdoMnJTYfcixGXJTpp2yGmuCznqw8tj78E9po8UC.json", { encoding: "utf8" });
      //   const tx = JSON.parse(data);
      //   const { trades, liquidities } = parser.parseAll(tx as any, { tryUnknowDEX: false });
      //   console.log('trades', trades);
      //   console.log('liquidities', liquidities);
      // });
    });
  });
});
