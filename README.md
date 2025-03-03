# Solana Dex Transaction Parser

A TypeScript library for parsing Solana DEX swap transactions. Supports multiple DEX protocols including Jupiter, Raydium, Meteora, PumpFun, and Moonshot.

## Features

- Parse **Swap** transactions from multiple DEX protocols
  - Support for transfer and transfer-check instructions
  - Detailed swap information extraction
- Parsing methods:
  - Pumpfun and Jupiter: parsing the event data
  - Raydium, Orca, and Meteora: parsing Transfer and TransferChecked methods of the token program
  - Moonshot: parsing the instruction data of the Trade instruction
- Parse **Liquidity** transactions (create, add, remove)
  - Raydium V4
  - Raydium CL
  - Raydium CPMM
  - Meteora DLMM
  - Meteora Pools
  - Orca
- Comprehensive test coverage

## Supported DEX Protocols

- Jupiter
- Raydium (V4, Route, CPMM, ConcentratedLiquidity)
- Meteora (DLMM and Pools)
- PumpFun
- Moonshot
- Orca
- Sanctum
- Phoenix
- Lifinity
- OKX Dex
  
## Supported Trading Bot Programs
- BananaGun
- Mintech
- Bloom
- Maestro
- Nova
- Apepro


## Installation

```bash
npm install solana-dex-parser
```

## Usage

### Configuration Options

The DexParser class doesn't require any configuration. It automatically detects the DEX protocol used in the transaction and applies the appropriate parsing logic.

### 1. Basic Usage > Swap (Buy and Sell)

```typescript
import { Connection } from '@solana/web3.js';
import { DexParser } from 'solana-dex-parser';

async function parseSwap() {
  // Setup connection
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  
  // Get transaction
  const signature = 'your-transaction-signature';
 
  const parser = new DexParser(connection);

  // case 1, by signature
  const trades = await parser.parseTransaction(signature);
  console.log("Trades:", trades);

  // case 2, by tx object
  const tx = await connection.getParsedTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });

  const trades2 = await parser.parseTrades(tx);
  console.log("trades2:", trades2);
}

```

#### Output

```
 [
      {
        type: 'BUY',
        inputToken: {
          mint: 'So11111111111111111111111111111111111111112',
          amount: 0.099009801,
          decimals: 9,
          authority: '',
          destination: '8Wyi1ikEcLsHKA7daP1JmUrAyEc96jLn3tzLnuMwN5nH',
          source: '5o5VW6zPTwTk2j9fkQJ7ueHL4rcEtzDhcGafsxE71AyB'
        },
        outputToken: {
          mint: 'B3Pza9YDAaTrMtxR5JeFFEGKSdJSyNLnj49nSYHDpump',
          amount: 1070376.821916,
          decimals: 6,
          authority: '8Wyi1ikEcLsHKA7daP1JmUrAyEc96jLn3tzLnuMwN5nH',
          destination: '3QvZvTSWt4gS1Vyiz1zR3afJjETzaev9JKJ3J356Sk1b',
          source: 'E7v5iScw1vUupebaDd7grmjVrSgsgdhVpm4w2bbDxbPn'
        },
        user: '5o5VW6zPTwTk2j9fkQJ7ueHL4rcEtzDhcGafsxE71AyB',
        programId: '6m2CDdhRgxpH4WjvdzxAYbGxwdGUz5MziiL5jek2kBma',
        amm: 'Pumpfun',
        route: 'OKX',
        slot: 324037348,
        timestamp: 1740898227,
        signature: '648cwSysqKXnb3XLPy577Lu4oBk7jimaY8p95JGfS9QUNabYar5pzfcRdu518TWw3dbopquJnMne9qx22xuf8xqn',
        idx: '7-2',
        fee: {
          mint: 'So11111111111111111111111111111111111111112',
          amount: 0.000990098,
          decimals: 9,
          authority: '',
          destination: 'CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM',
          source: '5o5VW6zPTwTk2j9fkQJ7ueHL4rcEtzDhcGafsxE71AyB'
        }
      }
    ]
```

### 2. Liquidity Usage

```typescript
import { Connection } from '@solana/web3.js';
import { DexParser } from 'solana-dex-parser';

async function parseLiquidityEvents() {
  // Setup connection
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  
  // Get transaction
  const signature = 'your-transaction-signature';
  const tx = await connection.getParsedTransaction(signature, {
    maxSupportedTransactionVersion: 0,
  });
 
  // Parse events
  const parser = new DexParser(connection);
  const events = await parser.parseLiquidity(tx);
  console.log("events:", events);
}

```

#### 2.1 Output - pumpfun events
```
 [
      {
        type: 'CREATE',
        data: {
          name: 'Central African Republic Meme',
          symbol: 'CAR',
          uri: 'https://ipfs.io/ipfs/QmTWn4hHDQRPH1e9qtn3cYVoNr9UDUVT2e78XWDsPSXDmj',
          mint: '7oBYdEhV4GkXC19ZfgAvXpJWp2Rn9pm1Bx2cVNxFpump',
          bondingCurve: 'AoUhiHypP1mMzgRjV7FMHpbQTe6sMZ8PTWt4MBABNUky',
          user: '121ftnYRm3WJmDHCWrazzRoyZAzZQ4xc5XD7dp3sfpfo'
        },
        slot: 319598427,
        timestamp: 1739140071,
        signature: '3EopoRXpPKHUwZcfGpV4yp7v5kTyQSdKHMB88oM7BqoUqaaCgst93oNLHTNiDg2XzW8j1KRfu2e6tVMxb3czAPMN',
        idx: '2-14'
      },
      {
        type: 'COMPLETE',
        data: {
          user: '121ftnYRm3WJmDHCWrazzRoyZAzZQ4xc5XD7dp3sfpfo',
          mint: '7oBYdEhV4GkXC19ZfgAvXpJWp2Rn9pm1Bx2cVNxFpump',
          bondingCurve: 'AoUhiHypP1mMzgRjV7FMHpbQTe6sMZ8PTWt4MBABNUky',
          timestamp: 1739140071n
        },
        slot: 319598427,
        timestamp: 1739140071,
        signature: '3EopoRXpPKHUwZcfGpV4yp7v5kTyQSdKHMB88oM7BqoUqaaCgst93oNLHTNiDg2XzW8j1KRfu2e6tVMxb3czAPMN',
        idx: '4-0'
      },
      {
        type: 'TRADE',
        data: {
          mint: '7oBYdEhV4GkXC19ZfgAvXpJWp2Rn9pm1Bx2cVNxFpump',
          solAmount: 85.005359057,
          tokenAmount: 793100000,
          isBuy: true,
          user: '121ftnYRm3WJmDHCWrazzRoyZAzZQ4xc5XD7dp3sfpfo',
          timestamp: 1739140071n,
          virtualSolReserves: 115.005359057,
          virtualTokenReserves: 279900000
        },
        slot: 319598427,
        timestamp: 1739140071,
        signature: '3EopoRXpPKHUwZcfGpV4yp7v5kTyQSdKHMB88oM7BqoUqaaCgst93oNLHTNiDg2XzW8j1KRfu2e6tVMxb3czAPMN',
        idx: '4-4'
      }
    ]
```
#### 2.2 Output - Meteora
```
 [
      {
        user: 'KYaNZJsLWbgdc22JqM3x6FLBTz5JVZiwNdByFPoPHLL',
        type: 'REMOVE',
        programId: 'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo',
        amm: 'MeteoraDLMM',
        slot: 322956851,
        timestamp: 1740470617,
        signature: 'Cj2c5dEmHvmMWwkMa4QMauQE6aBbyRz5mn4fEYARez2bHqukkJ3nbYAdst9ixQsAMh9G9tUNntAxEXpgrz5T1Qi',
        idx: '6',
        poolId: 'BoeMUkCLHchTD31HdXsbDExuZZfcUppSLpYtV3LZTH6U',
        poolLpMint: 'BoeMUkCLHchTD31HdXsbDExuZZfcUppSLpYtV3LZTH6U',
        token0Mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
        token1Mint: 'So11111111111111111111111111111111111111112',
        token0Amount: 18.504862033,
        token1Amount: 6.074752463
      }
    ]
```

### 3. Common Use Cases

#### 3.1 Analyzing DEX trading activity:

```typescript
const signatures = ['sig1', 'sig2', 'sig3'];
const allTrades = [];

for (const signature of signatures) {
  const parsedTransaction = await connection.getParsedTransaction(signature);
  const trades = dexParser.parseTransaction(parsedTransaction);
  allTrades.push(...trades);
}

console.log(`Total trades: ${allTrades.length}`);
```

#### 3.2 Extracting token transfer information:

```typescript
import { TransferParser } from 'solana-dex-parser';


// Setup connection
const connection = new Connection('https://api.mainnet-beta.solana.com');
// Get transaction
const signature = 'your-transaction-signature';
const tx = await connection.getParsedTransaction(signature, {
  maxSupportedTransactionVersion: 0,
});

const transferParser = new TransferParser();
const transfers = transferParser.parseTransfers(tx);

console.log(transfers);
```

#### 3.3 Extracting Pumpfun events (create/trade/complete):

```typescript
import { PumpfunEventParser } from 'solana-dex-parser';
  
// Setup connection
const connection = new Connection('https://api.mainnet-beta.solana.com');
// Get transaction
const signature = 'your-transaction-signature';
const tx = await connection.getParsedTransaction(signature, {
  maxSupportedTransactionVersion: 0,
});

const eventParser = new PumpfunEventParser(tx);
const events = eventParser.processEvents(); // PumpfunEvent[]

console.log(events);

```
```typescript
export interface PumpfunEvent {
  type: "TRADE" | "CREATE" | "COMPLETE";
  data: PumpfunTradeEvent | PumpfunCreateEvent | PumpfunCompleteEvent;
  slot: number;
  timestamp: number;
  signature: string;
}
```

## Note
- Jupiter Swap is obtained by parsing Instruction information, and the output only contains a transaction record after the sum (excluding the specific route swap record).
- Other aggregators, such as OKX, output multiple swap transaction records (swap records per amm).
- Except for specially specified parsers(Jupiter,Pumpfun,Moonshot), swap records are fetched by parsing transferActions
- Orca Liquidity analysis, not yet support for OrcaV1,OrcaV2.

## Development

### Prerequisites

- Node.js >= 16
- npm >= 7

### Setup

1. Clone the repository
```bash
git clone https://github.com/cxcx-ai/solana-dex-parser.git
cd solana-dex-parser
```

2. Install dependencies
```bash
npm install
```

3. Build the project
```bash
npm run build
```

### Testing

Run the test suite:
```bash
npm test
```

Run unit tests:
```bash
npm run test parser.test.ts
npm run test liquidity-raydium.test.ts
......
```

### Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

This project is a TypeScript port of the original Go implementation [solanaswap-go](https://github.com/franco-bianco/solanaswap-go).