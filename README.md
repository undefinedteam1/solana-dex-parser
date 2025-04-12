# Solana Dex Transaction Parser

A TypeScript library for parsing Solana DEX swap transactions. Supports multiple DEX protocols including Jupiter, Raydium, Meteora, PumpFun, and Moonshot.

## 🚀 What's New

### 2.2.5
- Added `amountRaw` field (raw amount as string)
- Added token0AmountRaw and token1AmountRaw fields (raw amount as string)
- Added post and pre balances of the destination and source token accounts (TokenInfo and TransferData)

### 2.1.9
- Added destinationOwner field (TransferData, TokenInfo)
- Added transfer parser if needed (if no trades and no liquidity)

### 2.0.6
- Support Pumpfun AMM (Pumpswap)
- Added Pumpswap events parser (Trade and Liquidity)
  
### 2.0.0
Major refactoring with enhanced transaction parsing support:
- Support for multiple transaction formats:
  - `getTransaction`/`getParsedTransaction`
  - Transactions of `getBlock`/`getParsedBlock` 
- Unified parsing interface for both parsed and compiled transactions
- Improved performance with optimized data processing
- Enhanced error handling and stability
- Simplified API with better TypeScript support

## Features

- Parse **Swap** transactions from multiple DEX protocols
  - Support for transfer and transfer-check instructions
  - Detailed swap information extraction
- Parsing methods:
  - Pumpfun and Jupiter: parsing the event data
  - Raydium, Orca, and Meteora: parsing Transfer and TransferChecked methods of the token program
  - Raydium v4 Logs decoder (decode ray_log)
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
- PumpFun AMM (Pumpswap)
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
yarn add solana-dex-parser
```

## Usage

### Configuration Options

The DexParser class supports the following configuration:

```typescript
interface ParseConfig {
  tryUnknowDEX?: boolean;   // Try to parse unknown DEX programs，results may be inaccurate (default: false)
  programIds?: string[];    // Only parse specific program IDs
  ignoreProgramIds?: string[]; // Ignore specific program IDs
  rawAmount?: boolean;      // Return raw amounts instead of UI amounts (default: false)
}
```


### Parse All (Trades, Liquidity and Transfers)
Parse all types of transactions including DEX trades, liquidity operations, and token transfers.

```typescript
import { Connection } from '@solana/web3.js';
import { DexParser } from 'solana-dex-parser';

async function parseAll() {
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const signature = 'your-transaction-signature';
  
  const tx = await connection.getTransaction(signature, {
    maxSupportedTransactionVersion: 0,
  });

  // Parse all types of transactions in one call
  const parser = new DexParser();
  const result = parser.parseAll(tx, {
    rawAmount: true,    // Return raw amounts as strings
    tryUnknowDEX: true, // Try to parse unknown DEX programs
  });

  console.log({
    trades: result.trades,         // DEX trading activities
    liquidities: result.liquidities, // Liquidity operations
    transfers: result.transfers,     // Regular token transfers (non-DEX)
    state: result.state,          // Parsing state
    msg: result.msg,             // Error message if any
  });
}

```

### 1. Basic Usage > Swap (Buy and Sell)

```typescript
import { Connection } from '@solana/web3.js';
import { DexParser } from 'solana-dex-parser';

async function parseSwap() {
  // Setup connection
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  
  // Get transaction (supports both parsed and compiled transactions)
  const signature = 'your-transaction-signature';
  const tx = await connection.getTransaction(signature, {
    maxSupportedTransactionVersion: 0,
  });
  // Or use getParsedTransaction
  // const tx = await connection.getParsedTransaction(signature);

  // Parse trades
  const parser = new DexParser();
  const trades = await parser.parseTrades(tx, {
    rawAmount: true,  // bigint string
    tryUnknowDEX: false,  // only parse known DEX programs
  });
  console.log("trades:", trades);
}

```

#### Output

```
 trades [
      {
        type: 'BUY',
        inputToken: {
          mint: 'So11111111111111111111111111111111111111112',
          amount: 0.099009801,
          decimals: 9,
          authority: undefined,                                     
          source: '5o5VW6zPTwTk2j9fkQJ7ueHL4rcEtzDhcGafsxE71AyB',   
          destination: '8Wyi1ikEcLsHKA7daP1JmUrAyEc96jLn3tzLnuMwN5nH', 
          destinationOwner: undefined,                              
          destinationBalance: undefined,
          destinationPreBalance: undefined,
          sourceBalance: undefined,
          sourcePreBalance: undefined
        },
        outputToken: {
          mint: 'B3Pza9YDAaTrMtxR5JeFFEGKSdJSyNLnj49nSYHDpump',
          amount: 1070376.821916,                                   // Raw amount or uiAmount (config set by rawAmount option)
          decimals: 6,
          authority: '8Wyi1ikEcLsHKA7daP1JmUrAyEc96jLn3tzLnuMwN5nH', // Transfer authority (sender)
          source: 'E7v5iScw1vUupebaDd7grmjVrSgsgdhVpm4w2bbDxbPn', // Source token account
          destination: '3QvZvTSWt4gS1Vyiz1zR3afJjETzaev9JKJ3J356Sk1b', // Destination token account
          destinationOwner: '5o5VW6zPTwTk2j9fkQJ7ueHL4rcEtzDhcGafsxE71AyB', // Owner of the destination account
          destinationBalance: 1383049.394757,                               // postTokenBalance
          destinationPreBalance: 312672.572841,                             // preTokenBalance
          sourceBalance: 516380474.293765,
          sourcePreBalance: 517450851.115681
        },
        user: '5o5VW6zPTwTk2j9fkQJ7ueHL4rcEtzDhcGafsxE71AyB',
        programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
        amm: 'Pumpfun',
        route: 'OKX',
        slot: 324037348,
        timestamp: 1740898227,
        signature: '648cwSysqKXnb3XLPy577Lu4oBk7jimaY8p95JGfS9QUNabYar5pzfcRdu518TWw3dbopquJnMne9qx22xuf8xqn',
        idx: '7-5'
      }
    ]
```

### Block Transaction Parsing

```typescript
import { Connection } from '@solana/web3.js';
import { DexParser } from 'solana-dex-parser';

// Works with both getBlock and getParsedBlock
async function parseBlockTransactions() {
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const slot = 'your-block-slot';
  
 try {
    const block = await connection.getBlock(slot, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
      transactionDetails: 'full',
    });
    // Or use getParsedBlock
    // const block = await connection.getParsedBlock(slot,{
    //   commitment: 'confirmed',
    //   maxSupportedTransactionVersion: 0,
    //   transactionDetails: 'full',
    // });

    const parser = new DexParser();
    const trades = [];
    const liquidityEvents = [];

    for (const tx of block.transactions) {
      if (tx.meta?.err) continue;

      const txData = {
        ...tx!,
        slot: block.parentSlot + 1,
        blockTime: block.blockTime
      };

      trades.push(...parser.parseTrades(txData));
      liquidityEvents.push(...parser.parseLiquidity(txData));
    }

    return { trades, liquidityEvents };
  } catch (error) {
    console.error('Failed to parse block:', error);
    throw error;
  }
}
```

### 2. Liquidity Events Parsing

```typescript
import { Connection } from '@solana/web3.js';
import { DexParser } from 'solana-dex-parser';

async function parseLiquidityEvents() {
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const signature = 'your-transaction-signature';
  
  // Works with both parsed and unparsed transactions
  const tx = await connection.getTransaction(signature, {
    maxSupportedTransactionVersion: 0,
  });
 
  const parser = new DexParser();
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

### 3. More Use Cases

#### 3.1 Extracting Pumpfun events (create/trade/complete):

```typescript
import { PumpfunEventParser,TransactionAdapter } from 'solana-dex-parser';
  
// Setup connection
const connection = new Connection('https://api.mainnet-beta.solana.com');
// Get transaction
const signature = 'your-transaction-signature';
const tx = await connection.getParsedTransaction(signature, {
  maxSupportedTransactionVersion: 0,
});

const eventParser = new PumpfunEventParser(new TransactionAdapter(tx));
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

#### 3.2 Raydium v4 logs decode:

```typescript
import { decodeRaydiumLog, LogType, parseRaydiumSwapLog } from 'solana-dex-parser';

  const log = decodeRaydiumLog("ray_log: A0lQ1uGPAAAAWnKACwAAAAABAAAAAAAAACRBWYc/AgAANLV+oBcAAACInZmY0pIAAO8MAhcAAAAA");
  if (log) {
    if (log.logType == LogType.SwapBaseIn || log.logType == LogType.SwapBaseOut) {
      const swap = parseRaydiumSwapLog(log as any);
      console.log('swap', swap); // buy and sell 
    }
    else {
      console.log('log', log); // add/remove liquidity
    }
  }

  // output
  swap {
      type: 'Buy',
      mode: 'Exact Input',
      inputAmount: 617969242185n,
      outputAmount: 386010351n,
      slippageProtection: 192967258n
    }
```

## Note
- Jupiter Swap outputs aggregated transaction records
- Other aggregators (e.g., OKX) output multiple swap transaction records per AMM
- Most swap records are parsed from transfer actions except for Jupiter, Pumpfun, and Moonshot
- Orca Liquidity analysis: OrcaV1 and OrcaV2 support is limited

## Development

### Prerequisites

- Node.js >= 18.8.0
- yarn

### Setup

1. Clone the repository
```bash
git clone https://github.com/cxcx-ai/solana-dex-parser.git
cd solana-dex-parser
```

2. Install dependencies
```bash
yarn install
```

3. Build the project
```bash
yarn build
```

### Testing

Run the test suite:
```bash
yarn test
```

Run unit tests:
```bash
yarn test parser.test.ts
yarn test liquidity-raydium.test.ts
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