import { Connection } from "@solana/web3.js";
import dotenv from "dotenv";
import { OrcaLiquidityParser } from "../parsers/parser-orca-liquidity";

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

  describe("Orca", () => {
    it("Add LP", async () => {
      const tx = await connection.getParsedTransaction(
        "3mZcyeDJysgs79nLcvtN4XQ6iepyERqG93P2F2ZYgUX4ZF1Yr1XFBMKR8DHd7z4gN2EmvAqMc3KhQTQpGMbtvhF7",
        {
          maxSupportedTransactionVersion: 0,
        },
      );
      const parser = new OrcaLiquidityParser(tx!);
      const events = parser.processLiquidity();
      console.log(events);
      expect(events.length).toEqual(1);
    });
    it("Add LP v2", async () => {
      const tx = await connection.getParsedTransaction(
        "4Kv6gQgdSsCPSxRApiCNMHFE1dKKGVugrJTzdzSYX5a2aXho4o7jaQDSHLH3RTsr5aVwpkzWL1o5mSCyDtHeZKZr",
        {
          maxSupportedTransactionVersion: 0,
        },
      );
      const parser = new OrcaLiquidityParser(tx!);
      const events = parser.processLiquidity();
      console.log(events);
      expect(events.length).toEqual(1);
    });

    it("Remove LP", async () => {
      const tx = await connection.getParsedTransaction(
        "23zkGAorUC3aHSk7zJYiUvvs6gEXPPzp8xRiWfACzkrqBEaQrKiH9QCgrmwSTD6hxKKEjryEGbEvurt6xSBpuBMC",
        {
          maxSupportedTransactionVersion: 0,
        },
      );
      const parser = new OrcaLiquidityParser(tx!);
      const events = parser.processLiquidity();
      console.log(events);
      expect(events.length).toEqual(1);
    });
  });
});
