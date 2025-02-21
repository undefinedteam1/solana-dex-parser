import { Connection } from "@solana/web3.js";
import dotenv from "dotenv";
import { MeteoraLiquidityParser } from "../parsers/parser-meteora-liquidity";

dotenv.config();

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
    it("Add LP", async () => {
      const tx = await connection.getParsedTransaction(
        "4AZBcYYZfHTsrPXttv8UCAqKLBj8j8roEHW5evbpCYdx34e6Sxsb5P1VGiPMjScKy1caTtwGEfQH9rFUhvDdJxMU",
        {
          maxSupportedTransactionVersion: 0,
        },
      );
      const parser = new MeteoraLiquidityParser(tx!);
      const events = parser.processLiquidity();
      console.log(events);
      expect(events.length).toEqual(1);
    });

    it("Remove LP", async () => {
      const tx = await connection.getParsedTransaction(
        "sYGH1o3g8crh5dcgzn3WBD29wPxaKKXhPL1Baf1tac79yUTWmQ484vXbyf48Gr85RAgTHFc8scjPvyMaJnW24NA",
        {
          maxSupportedTransactionVersion: 0,
        },
      );
      const parser = new MeteoraLiquidityParser(tx!);
      const events = parser.processLiquidity();
      console.log(events);
      expect(events.length).toEqual(1);
    });
  });

  describe("Meteora Pools", () => {
    it("Create LP", async () => {
      const tx = await connection.getParsedTransaction(
        "2GWLwbEjyR7moFYK5JfapbsDBrBz3298BVWsAebhUECPaXjLbTZ6DkbEN34BF57jdGot7GkwDnrzszFB3H9AJxmS",
        {
          maxSupportedTransactionVersion: 0,
        },
      );
      const parser = new MeteoraLiquidityParser(tx!);
      const events = parser.processLiquidity();
      console.log(events);
      expect(events.length).toEqual(1);
    });
    it("Add LP", async () => {
      const tx = await connection.getParsedTransaction(
        "LaocVd6PpfdH1KTdQuRTf5WwnUzmyf3gdAy16xro747nzrhpgXg1oxFrpgBk31tPh24ksVAyiSkNW7vncoKTGyH",
        {
          maxSupportedTransactionVersion: 0,
        },
      );
      const parser = new MeteoraLiquidityParser(tx!);
      const events = parser.processLiquidity();
      console.log(events);
      expect(events.length).toEqual(1);
    });
    it("Remove LP", async () => {
      const tx = await connection.getParsedTransaction(
        "2xEAewTjtSHgpEHHzaNjHiuoMHNZQXz5vySXHCSL8omujjvaxq9JsfGWjusz43ndmzcu5riESKm1UH4riWDX9v1v",
        {
          maxSupportedTransactionVersion: 0,
        },
      );
      const parser = new MeteoraLiquidityParser(tx!);
      const events = parser.processLiquidity();
      console.log(events);
      expect(events.length).toEqual(1);
    });
  });
});
