import { Connection, ParsedNoneModeBlockResponse, ParsedTransaction, ParsedTransactionWithMeta, VersionedAccountsModeBlockResponse, VersionedBlockResponse } from '@solana/web3.js';
import dotenv from 'dotenv';
import { DexParser } from '../dex-parser';

dotenv.config();

const TEST_TRANSACTIONS = {
  Orca: '2kAW5GAhPZjM3NoSrhJVHdEpwjmq9neWtckWnjopCfsmCGB27e3v2ZyMM79FdsL4VWGEtYSFi1sF1Zhs7bqdoaVT', // OK
  Pumpfun: '4Cod1cNGv6RboJ7rSB79yeVCR4Lfd25rFgLY3eiPJfTJjTGyYP1r2i1upAYZHQsWDqUbGd1bhTRm1bpSQcpWMnEz', // OK
  PumpfunCreate: '4Cod1cNGv6RboJ7rSB79yeVCR4Lfd25rFgLY3eiPJfTJjTGyYP1r2i1upAYZHQsWDqUbGd1bhTRm1bpSQcpWMnEz',
  PumpfunComplete: 'v8s37Srj6QPMtRC1HfJcrSenCHvYebHiGkHVuFFiQ6UviqHnoVx4U77M3TZhQQXewXadHYh5t35LkesJi3ztPZZ',
  BananaGun: 'oXUd22GQ1d45a6XNzfdpHAX6NfFEfFa9o2Awn2oimY89Rms3PmXL1uBJx3CnTYjULJw6uim174b3PLBFkaAxKzK', // OK
  Jupiter: 'DBctXdTTtvn7Rr4ikeJFCBz4AtHmJRyjHGQFpE59LuY3Shb7UcRJThAXC7TGRXXskXuu9LEm9RqtU6mWxe5cjPF', // OK
  JupiterDCA: '4mxr44yo5Qi7Rabwbknkh8MNUEWAMKmzFQEmqUVdx5JpHEEuh59TrqiMCjZ7mgZMozRK1zW8me34w8Myi8Qi1tWP', // OK
  MeteoraDLMM: '125MRda3h1pwGZpPRwSRdesTPiETaKvy4gdiizyc3SWAik4cECqKGw2gggwyA1sb2uekQVkupA2X9S4vKjbstxx3', // OK
  RaydV4: '5kaAWK5X9DdMmsWm6skaUXLd6prFisuYJavd9B62A941nRGcrmwvncg3tRtUfn7TcMLsrrmjCChdEjK3sjxS6YG9', // OK
  RaydRouting: '51nj5GtAmDC23QkeyfCNfTJ6Pdgwx7eq4BARfq1sMmeEaPeLsx9stFA3Dzt9MeLV5xFujBgvghLGcayC3ZevaQYi', //OK
  RaydCPMM: 'afUCiFQ6amxuxx2AAwsghLt7Q9GYqHfZiF4u3AHhAzs8p1ThzmrtSUFMbcdJy8UnQNTa35Fb1YqxR6F9JMZynYp', //OK
  RaydConcentratedLiquiditySwapV2:
    '2durZHGFkK4vjpWFGc5GWh5miDs8ke8nWkuee8AUYJA8F9qqT2Um76Q5jGsbK3w2MMgqwZKbnENTLWZoi3d6o2Ds', //OK
  RaydConcentratedLiquiditySwap:
    '4MSVpVBwxnYTQSF3bSrAB99a3pVr6P6bgoCRDsrBbDMA77WeQqoBDDDXqEh8WpnUy5U4GeotdCG9xyExjNTjYE1u', //OK
  Maestro: 'mWaH4FELcPj4zeY4Cgk5gxUirQDM7yE54VgMEVaqiUDQjStyzwNrxLx4FMEaKEHQoYsgCRhc1YdmBvhGDRVgRrq', //OK
  MeteoraCPMM: '7YPF21r7JBDeoXuMJn6KSqDVYGrm821U87Cnje3xPvZpMUVaAEAvCGJPP6va2b5oMLAzGku5s3TcNAsN6zdXPRn',
  MeteoraPoolsProgram: '4uuw76SPksFw6PvxLFkG9jRyReV1F4EyPYNc3DdSECip8tM22ewqGWJUaRZ1SJEZpuLJz1qPTEPb2es8Zuegng9Z', // OK
  MoonshotBuy: 'AhiFQX1Z3VYbkKQH64ryPDRwxUv8oEPzQVjSvT7zY58UYDm4Yvkkt2Ee9VtSXtF6fJz8fXmb5j3xYVDF17Gr9CG', // OK
  MoonshotSell: '2XYu86VrUXiwNNj8WvngcXGytrCsSrpay69Rt3XBz9YZvCQcZJLjvDfh9UWETFtFW47vi4xG2CkiarRJwSe6VekE', // OK
  OKX: '5xaT2SXQUyvyLGsnyyoKMwsDoHrx1enCKofkdRMdNaL5MW26gjQBM3AWebwjTJ49uqEqnFu5d9nXJek6gUSGCqbL', // OK
  OKX_commission_spl_swap2: "53tdwmNWEp9KsyegiDk7Z3DXVfSQoBXpAJfZbpAUTwzCtDkfrbdCN17ksQnKdH2p9yBTrYHGhTvHrckaPCSshBkU",
  OKX_Swap2: "3rEob1PiezEtzhjPJcDJ9menwWeUBmF19FfYysHP5v6DRQe6PVrWcLRBvAGDbB9Ubn8PF8FVKjQYVxDjA2wAwSgn",
  OKX_commission_spl_proxy_swap: "33VnDBtrFawBRYwDqomdsH57GL83B7eWTQN5mnga9F1whyMzcpdmURnPkAjqDte8Ja9EcsGcejhDYcUKkA9sE4HG"
} as Record<string, string>;

describe('Parser', () => {
  let connection: Connection;
  beforeAll(async () => {
    // Initialize connection
    const rpcUrl = process.env.SOLANA_RPC_URL;
    if (!rpcUrl) {
      throw new Error('SOLANA_RPC_URL environment variable is not set');
    }
    connection = new Connection(rpcUrl);
  });

  describe('Dex', () => {
    describe('parseTransaction', () => {
      // ['7YPF21r7JBDeoXuMJn6KSqDVYGrm821U87Cnje3xPvZpMUVaAEAvCGJPP6va2b5oMLAzGku5s3TcNAsN6zdXPRn',
      //   // 'v8s37Srj6QPMtRC1HfJcrSenCHvYebHiGkHVuFFiQ6UviqHnoVx4U77M3TZhQQXewXadHYh5t35LkesJi3ztPZZ',
      //   // '125MRda3h1pwGZpPRwSRdesTPiETaKvy4gdiizyc3SWAik4cECqKGw2gggwyA1sb2uekQVkupA2X9S4vKjbstxx3',
      //   // '2durZHGFkK4vjpWFGc5GWh5miDs8ke8nWkuee8AUYJA8F9qqT2Um76Q5jGsbK3w2MMgqwZKbnENTLWZoi3d6o2Ds',
      //   // '4uuw76SPksFw6PvxLFkG9jRyReV1F4EyPYNc3DdSECip8tM22ewqGWJUaRZ1SJEZpuLJz1qPTEPb2es8Zuegng9Z',
      //   // '33VnDBtrFawBRYwDqomdsH57GL83B7eWTQN5mnga9F1whyMzcpdmURnPkAjqDte8Ja9EcsGcejhDYcUKkA9sE4HG'
      // ].forEach(async (signature) => {
        Object.values(TEST_TRANSACTIONS).forEach(async (signature) => {
        it(signature, async () => {
          const parser = new DexParser(connection);

          // const trades = await parser.parseTransaction(signature);

          const tx = await connection.getParsedTransaction(signature, {
            maxSupportedTransactionVersion: 0,
          });
          if(!tx) {
            throw new Error("Transaction not found");
          }
          const trades = parser.parseTrades(tx!);
          // console.log("Trades:", trades);

          // const liquidity = parser.parseLiquidity(tx!);
          // console.log('liquidity', liquidity);
          expect(trades.length).toBeGreaterThan(0);
        });
      }
      );
    });

    // describe('parseTransaction', () => {
    //   it("block", async () => {
    //     const parser = new DexParser(connection);

    //     // const trades = await parser.parseTransaction(signature);

    //     const block = await connection.getParsedBlock(322192638, {
    //       commitment: 'confirmed',
    //       maxSupportedTransactionVersion: 0,
    //       transactionDetails: 'full',

    //     })
    //     const ts: any[] = [], liqs: any[] = [];
    //     block.transactions.forEach((tx) => {
    //       if(tx.meta?.err) {
    //         return;
    //       }
    //       const trades = parser.parseTrades({ ...tx!, slot: (block.parentSlot + 1), blockTime: block.blockTime } as any);
    //       const ls = parser.parseLiquidity({ ...tx!, slot: (block.parentSlot + 1), blockTime: block.blockTime } as any);
    //       ts.push(...trades);
    //       liqs.push(...ls);
    //     })

    //     console.log("Trades:", ts);
    //     console.log("Liquidity:", liqs);

    //   });
    // });

    // describe("parseLiquidity", () => {
    //   [
    //     "iB88JSVjSC13vJF9eigdgxVeWxb8RfAN8ggb2ndZCtQu2zHgiQaLkuiei2w8BGyMKGhDjFxjNxSVreAA4MaUsXs",
    //   ].forEach(async (signature) => {
    //     // Object.values(TEST_TRANSACTIONS).forEach(async (signature) => {
    //     it(signature, async () => {
    //       const tx = await connection.getParsedTransaction(signature, {
    //         maxSupportedTransactionVersion: 0,
    //       });

    //       // Parse events
    //       const parser = new DexParser(connection);
    //       const events = await parser.parseLiquidity(tx!);
    //       expect(events.length).toBeGreaterThan(0);
    //     });
    //   });
    // });
  });
});
