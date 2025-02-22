import { Connection } from "@solana/web3.js";
import dotenv from "dotenv";
import { MeteoraLiquidityParser } from "../parsers/parser-meteora-liquidity";

dotenv.config();

const tests = {
  ADD: [
    {
      signature:
        "4AZBcYYZfHTsrPXttv8UCAqKLBj8j8roEHW5evbpCYdx34e6Sxsb5P1VGiPMjScKy1caTtwGEfQH9rFUhvDdJxMU",
      type: "ADD",
      desc: "Meteora DLMM Program: addLiquidityByStrategy",
      name: "PAIN",
      poolId: "8Bn5BW27CSPosSWqzBywXruKoBLjGgSfdys15uP9RavL",
      token0Mint: "1Qf8gESP4i6CFNWerUSDdLKJ9U1LpqTYvjJ2MM4pain",
      token0Amount: 0,
      token1Mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", //USDC
      token1Amount: 69730.4961,
    },
    {
      signature:
        "3b536UNQGGwrfHsDA9tLTKHwcy5G2eMZMSPxDqWhGbQbNrFSd5QaPHMzuufotiv5sBQWNvLvfcmToHGLoLoU1jz5",
      type: "ADD",
      desc: "Meteora DLMM Program: addLiquidityByStrategy",
      name: "TRUMP",
      poolId: "9d9mb8kooFfaD3SctgZtkxQypkshx6ezhbKio89ixyy2",
      token0Mint: "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",
      token0Amount: 0,
      token1Mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", //USDC
      token1Amount: 619500.976753,
    },
  ],
  REMOVE: [
    {
      signature:
        "sYGH1o3g8crh5dcgzn3WBD29wPxaKKXhPL1Baf1tac79yUTWmQ484vXbyf48Gr85RAgTHFc8scjPvyMaJnW24NA",
      type: "REMOVE",
      desc: "Meteora DLMM Program: removeLiquidityByRange",
      name: "PAIN",
      poolId: "8Bn5BW27CSPosSWqzBywXruKoBLjGgSfdys15uP9RavL",
      token0Mint: "1Qf8gESP4i6CFNWerUSDdLKJ9U1LpqTYvjJ2MM4pain",
      token0Amount: 0,
      token1Mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", //USDC
      token1Amount: 69730.496031,
    },
    {
      signature:
        "38HUTGqsFeMzQkcqcV1DsmPfs6N4JhJEoa3vESHs7Zic4KyW3HkRTNyWmhCbw1YBub12sRcQ2VAjkUJcGVQpzYXg",
      type: "REMOVE",
      desc: "Meteora DLMM Program: removeLiquidityByRange",
      name: "TRUMP",
      poolId: "9d9mb8kooFfaD3SctgZtkxQypkshx6ezhbKio89ixyy2",
      token0Mint: "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",
      token0Amount: 20.919301,
      token1Mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      token1Amount: 110.714287,
    },
  ],
};

describe("Liquidity", () => {
  let connection: Connection;
  beforeAll(async () => {
    // Initialize connection
    const rpcUrl = process.env.SOLANA_RPC_URL;
    if (!rpcUrl) {
      throw new Error("SOLANA_RPC_URL environment variable is not set");
    }
    connection = new Connection(rpcUrl);
  });

  describe("Meteora DLMM", () => {
    Object.values(tests)
      .flat()
      .forEach((test) => {
        it(`${test.type} > ${test.name} > ${test.desc} `, async () => {
          const tx = await connection.getParsedTransaction(test.signature, {
            maxSupportedTransactionVersion: 0,
          });
          const parser = new MeteoraLiquidityParser(tx!);
          const events = parser.processLiquidity();
          expect(events.length).toEqual(1);
          expect(events[0].type).toEqual(test.type);
          expect(events[0].poolId).toEqual(test.poolId);
          expect(events[0].token0Mint).toEqual(test.token0Mint);
          expect(events[0].token0Amount).toEqual(test.token0Amount);
          expect(events[0].token1Mint).toEqual(test.token1Mint);
          expect(events[0].token1Amount).toEqual(test.token1Amount);
        });
      });
  });
});
