import { Connection } from '@solana/web3.js';
import dotenv from 'dotenv';
import { PumpswapEventParser } from '../parsers';
import { TransactionAdapter } from '../transaction-adapter';

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

  describe('Pumpswap', () => {
    it('pumpfun events', async () => {
      const tx = await connection.getTransaction(
      //  '23ACnYkaTqpHDvSJkhwqFb72KUXUjL4Bd8kwLNyRS1nzjxMxjrBnp7A5Gfogr9typ8imsckGfqWrCNhJg68MDsyL', //create & buy
               // '5fiQbExgdp1FAjDnrv9aEpXajCMUtm1c3E7NnsDdu4CtKr5xBpALdK7ENzx5LN1SzZKJk7cxbWWc84T7yHwb8p2x', // create pool & buy
        // '63PQNtzDQdBDnf7FMC4jafDPhDVZHHhZwhJAbCT25efDgXt4H3fxPSQCAacV5Psaz5aKrRk35ubc97oQuozg9rwV', // deposit
        // "2Z6pDoWEVYwf4v4fzNVNLW1c2DzEK24WhpyK45ZBkZBiUBogVCfG67U5b1ff6W3ixKPotLTB2k5FTKCKgNtKYJgv", // withdraw
        '5cvgMuLS7JmbU2WTv5gzLag2YmvuMAwuBBjLvZfGsBBW29PAGQTzhevG977yqu4PUoLbYtWjFPoAtmvwMbieS8SF',//withdraw
// 'hK2uGL365L97fmYRoapkr3wvoMbTe4DtzQqJrwLrSkdSBLF7WyuW8sxj9pBe2ikjshuFWMsxgE83Bw6VURdMEPH',//buy
                // "4oPbwpFNh4LwP1p5JqyPHYLq83cWpfyW5jj4tVVbRocKqNiAuF8LRDZzqAbawBdvXsNeh2mX2ERMT1i17n8E3SN7", // sell
        {
          maxSupportedTransactionVersion: 0,
        }
      );
      if (!tx) throw new Error('Transaction not found');
      const parser = new PumpswapEventParser(new TransactionAdapter(tx));
      const events = parser.processEvents();
      console.log(events);
      expect(events.length).toBeGreaterThan(0);
    });
  });
});
