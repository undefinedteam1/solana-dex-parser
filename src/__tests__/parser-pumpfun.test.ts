import { Connection } from '@solana/web3.js';
import dotenv from 'dotenv';
import { PumpfunEventParser } from '../parsers';

dotenv.config();

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

  describe('Pumpfun', () => {
    it('pumpfun events', async () => {
      const tx = await connection.getParsedTransaction(
        '3EopoRXpPKHUwZcfGpV4yp7v5kTyQSdKHMB88oM7BqoUqaaCgst93oNLHTNiDg2XzW8j1KRfu2e6tVMxb3czAPMN', // create & complete
        // "4Cod1cNGv6RboJ7rSB79yeVCR4Lfd25rFgLY3eiPJfTJjTGyYP1r2i1upAYZHQsWDqUbGd1bhTRm1bpSQcpWMnEz", // create
        // "v8s37Srj6QPMtRC1HfJcrSenCHvYebHiGkHVuFFiQ6UviqHnoVx4U77M3TZhQQXewXadHYh5t35LkesJi3ztPZZ", // complete
        {
          maxSupportedTransactionVersion: 0,
        }
      );
      const parser = new PumpfunEventParser(tx!);
      const events = parser.processEvents();
      // console.log(events);
      expect(events.length).toBeGreaterThan(1);
    });
  });
});
