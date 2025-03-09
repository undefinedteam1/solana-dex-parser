import { Connection } from '@solana/web3.js';
import dotenv from 'dotenv';
import { DexParser } from '../dex-parser';
import { tests } from './parser.test.case';

dotenv.config();

describe('Dex Parser', () => {
  let connection: Connection;
  let fetchTime = 0, processTime = 0;
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

  describe('Parse Trades', () => {
    const parser = new DexParser(connection);
    const expectItem = (item: any, test: any) => {
      expect(item.type).toEqual(test.type);
      expect(item.user).toEqual(test.user);
      expect(item.inputToken.mint).toEqual(test.inputToken.mint);
      expect(item.inputToken.amount).toEqual(test.inputToken.amount);
      expect(item.inputToken.decimals).toEqual(test.inputToken.decimals);
      expect(item.outputToken.mint).toEqual(test.outputToken.mint);
      expect(item.outputToken.amount).toEqual(test.outputToken.amount);
      expect(item.outputToken.decimals).toEqual(test.outputToken.decimals);
      expect(item.amm).toEqual(test.amm);
      expect(item.route).toEqual(test.route);
      expect(item.programId).toEqual(test.programId);
      expect(item.slot).toEqual(test.slot);
      expect(item.timestamp).toEqual(test.timestamp);
      expect(item.signature).toEqual(test.signature);
    }

    Object.values(tests)
      .flat()
      // .filter((test: any) => test.test == true) // test only
      .forEach((test) => {
        it(`${test.type} > ${test.amm} > ${test.signature} `, async () => {
          const s1 = Date.now();
          const tx = await connection.getTransaction(test.signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0,
          });
          if (!tx) { throw new Error(`Transaction not found > ${test.signature}`); }
          const s2 = Date.now();
          fetchTime += s2 - s1;
          const s3 = Date.now();

          const trades = parser.parseTrades(tx);

          const s4 = Date.now();
          processTime += s4 - s3;
          // console.log('fetchTime', fetchTime);
          // console.log('processTime', processTime);
          // console.log('trades', trades);
          expect(trades.length).toBeGreaterThanOrEqual(1);
          expectItem(trades[0], test);
          if (test.items) {
            expect(trades.length).toBeGreaterThan(1);
            expectItem(trades[1], test.items[0]);
          }
        });
      });
  });

  afterAll(async () => {
    console.log(`Fetch time: ${fetchTime / 1000} s > avg: ${(fetchTime) / 1000 / tests.length} s >`, '\n',
      `Process time: ${processTime / 1000} s > avg: ${(processTime) / 1000 / tests.length} s >`);
  });
});
