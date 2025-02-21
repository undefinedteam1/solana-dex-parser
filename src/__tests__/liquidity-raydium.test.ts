import { Connection } from "@solana/web3.js";
import dotenv from "dotenv";
import { RaydiumLiquidityParser } from "../parsers/parser-raydium-liquidity";

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

  describe("Raydium V4", () => {
    it("Create LP by pumpfun", async () => {
      const tx = await connection.getParsedTransaction(
        "49ejTjaCdqV3hwAs1GomGsTLqZNUWztHduHRCNr8m3Dogfyii29qkNPNauAr9VfEh9j5m7QHq8HYRd6FiaAACCf",
        {
          maxSupportedTransactionVersion: 0,
        },
      );
      const parser = new RaydiumLiquidityParser(tx!);
      const events = parser.processLiquidity();
      console.log(events);
      expect(events.length).toEqual(1);
    });

    it("Add LP", async () => {
      const tx = await connection.getParsedTransaction(
        "3yLZY9AmWkq4vTa7AKZD1nZ2Dr6TN9pTrNZY5yRVB3s1vZg2sYVEbRjPfer7uR3zc3k64iUAhHAF6dA78QWDxog7",
        {
          maxSupportedTransactionVersion: 0,
        },
      );
      const parser = new RaydiumLiquidityParser(tx!);
      const events = parser.processLiquidity();
      console.log(events);
      expect(events.length).toEqual(1);
    });

    it("Remove LP", async () => {
      const tx = await connection.getParsedTransaction(
        "2orV665TqyxAt5Q6RwPfA3rznScsSzya6FqAWRmj6hptn5gvjVJLALWYNfymgyrpGtZqsAJ1VcvHbBBhQCT47DfW",
        {
          maxSupportedTransactionVersion: 0,
        },
      );
      const parser = new RaydiumLiquidityParser(tx!);
      const events = parser.processLiquidity();
      console.log(events);
      expect(events.length).toEqual(1);
    });
  });

  describe("Raydium CL", () => {
    it("Create LP", async () => {
      const tx = await connection.getParsedTransaction(
        "54TqXAJT3JcuJe37TMT6nYcZzuRgYMkcLinZt4vNoJF3aVmFTU5yD1fWCFuqygSH4tBtyUJnb4fxUBA8XtGYsDRC",
        {
          maxSupportedTransactionVersion: 0,
        },
      );
      const parser = new RaydiumLiquidityParser(tx!);
      const events = parser.processLiquidity();
      console.log(events);
      expect(events.length).toEqual(1);
    });
    it("Add LP", async () => {
      const tx = await connection.getParsedTransaction(
        "4hVaQHrCJrzfPTP7XsbtUnwW7qWEM2fwF68WJQnvNfNVEU3Va5RAeZHACF93xy4vYeoxT52nK61hDk8twCW99BJc",
        {
          maxSupportedTransactionVersion: 0,
        },
      );
      const parser = new RaydiumLiquidityParser(tx!);
      const events = parser.processLiquidity();
      console.log(events);
      expect(events.length).toEqual(1);
    });
    it("Remove LP", async () => {
      const tx = await connection.getParsedTransaction(
        "48oGGt6rsBqbiyj7xyzWD8oRXk3sGhE6Kt6LzRG5QofL1LJqwtcfp4uKXeinDn4a24uyWJVGDPTaAFac2R5eNX1w",
        {
          maxSupportedTransactionVersion: 0,
        },
      );
      const parser = new RaydiumLiquidityParser(tx!);
      const events = parser.processLiquidity();
      console.log(events);
      expect(events.length).toEqual(1);
    });
  });

  describe("Raydium CPMM", () => {
    it("Create LP", async () => {
      const tx = await connection.getParsedTransaction(
        "xZmKodPHYxesDJzPLHfjqG4VvKJcQpwuo3fTa2T64LY9nePfAa97xtSmzCvSWJ5EFzYjAURLD666zqV8oJL8kTp",
        {
          maxSupportedTransactionVersion: 0,
        },
      );
      const parser = new RaydiumLiquidityParser(tx!);
      const events = parser.processLiquidity();
      console.log(events);
      expect(events.length).toEqual(1);
    });

    it("Add LP", async () => {
      const tx = await connection.getParsedTransaction(
        "2uVjffn9bwatwRnGZYRpJk5fhxTcGcGfvtc971FBdt1CgUhxESrG8qPN3DiahgaLDULC4JTqc1whSCfvZ5gzJRmL",
        {
          maxSupportedTransactionVersion: 0,
        },
      );
      const parser = new RaydiumLiquidityParser(tx!);
      const events = parser.processLiquidity();
      console.log(events);
      expect(events.length).toEqual(1);
    });

    it("Remove LP", async () => {
      const tx = await connection.getParsedTransaction(
        "5sYGW9tkSuh4UHUNGLwtLRSuAGHTTKQMqgaGtF7jB4r8EzADkVmq3nPfiWiQ7UhPn4vj2bpqNXvcKpqgMX1uWc97",
        {
          maxSupportedTransactionVersion: 0,
        },
      );
      const parser = new RaydiumLiquidityParser(tx!);
      const events = parser.processLiquidity();
      console.log(events);
      expect(events.length).toEqual(1);
    });
  });
});
