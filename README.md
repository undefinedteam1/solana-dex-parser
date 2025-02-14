# Solana Dex Transaction Parser

A TypeScript library for parsing Solana DEX swap transactions. Supports multiple DEX protocols including Jupiter, Raydium, Meteora, PumpFun, and Moonshot.

## Features

- Parse swap transactions from multiple DEX protocols
- Support for transfer and transfer-check instructions
- Detailed swap information extraction
- Built-in error handling and validation
- TypeScript type definitions
- Comprehensive test coverage

## Supported DEX Protocols

- Jupiter
- Raydium
- Meteora
- PumpFun
- Moonshot
- Orca
- Phoenix
- OKX Dex
  
## Supported Trading Bot Programs
- Banana gun
- Mintech
- Bloom
- Maestro
- Nova

## Installation

```bash
npm install solana-dex-parser
```

## Usage

### Basic Usage

```typescript
import { Connection } from '@solana/web3.js';
import { TransactionParser } from 'solana-dex-parser';

async function parseSwap() {
  // Setup connection
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  
  // Get transaction
  const signature = 'your-transaction-signature';
 
  const parser = new TransactionParser(connection);
  const trades = await parser.parseTransaction(signature);
  console.log("Trades:", trades);
}
```

### Advanced Usage

See the [examples](./examples) directory for more advanced usage examples.

## Development

### Prerequisites

- Node.js >= 16
- npm >= 7

### Setup

1. Clone the repository
```bash
git clone https://github.com/cxcx-ai/solana-dex-parser.git
cd solana-swap-ts
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

Run tests with coverage:
```bash
npm run test:coverage
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

This project is a TypeScript port of the original Go implementation [solana-swap-go](https://github.com/original/solana-swap-go).