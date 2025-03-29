// Define log types for different operations
enum LogType {
  Init = 0,
  Deposit = 1,
  Withdraw = 2,
  SwapBaseIn = 3,
  SwapBaseOut = 4,
}

// Constants for swap direction
const SWAP_DIRECTION = {
  COIN_TO_PC: 0n, // Token A -> Token B (e.g., SOL -> USDC)
  PC_TO_COIN: 1n, // Token B -> Token A (e.g., USDC -> SOL)
} as const;

// Interface for Add Liquidity operation log
interface DepositLog {
  logType: LogType;
  // Input parameters
  maxCoin: bigint; // Maximum amount of token A to add
  maxPc: bigint; // Maximum amount of token B to add
  base: bigint; // Base value for calculation
  // Pool information
  poolCoin: bigint; // Current pool token A amount
  poolPc: bigint; // Current pool token B amount
  poolLp: bigint; // Current pool LP token amount
  calcPnlX: bigint; // PnL calculation X
  calcPnlY: bigint; // PnL calculation Y
  // Operation results
  deductCoin: bigint; // Actual token A amount added
  deductPc: bigint; // Actual token B amount added
  mintLp: bigint; // LP tokens minted
}

// Interface for Remove Liquidity operation log
interface WithdrawLog {
  logType: LogType;
  // Input parameters
  withdrawLp: bigint; // LP tokens to withdraw
  // User information
  userLp: bigint; // User's LP token balance
  // Pool information
  poolCoin: bigint; // Current pool token A amount
  poolPc: bigint; // Current pool token B amount
  poolLp: bigint; // Current pool LP token amount
  calcPnlX: bigint; // PnL calculation X
  calcPnlY: bigint; // PnL calculation Y
  // Operation results
  outCoin: bigint; // Token A amount received
  outPc: bigint; // Token B amount received
}

// Interface for Exact Input Swap operation log
interface SwapBaseInLog {
  logType: LogType;
  // Input parameters
  amountIn: bigint; // Exact amount to swap in
  minimumOut: bigint; // Minimum amount to receive
  direction: bigint; // Swap direction (0: A->B, 1: B->A)
  // User information
  userSource: bigint; // User's source token balance
  // Pool information
  poolCoin: bigint; // Current pool token A amount
  poolPc: bigint; // Current pool token B amount
  // Operation results
  outAmount: bigint; // Actual amount received
}

// Interface for Exact Output Swap operation log
interface SwapBaseOutLog {
  logType: LogType;
  // Input parameters
  maxIn: bigint; // Maximum amount to swap in
  amountOut: bigint; // Exact amount to receive
  direction: bigint; // Swap direction (0: A->B, 1: B->A)
  // User information
  userSource: bigint; // User's source token balance
  // Pool information
  poolCoin: bigint; // Current pool token A amount
  poolPc: bigint; // Current pool token B amount
  // Operation results
  deductIn: bigint; // Actual amount paid
}

// Main function to decode Raydium logs
function decodeRaydiumLog(base64Log: string): DepositLog | WithdrawLog | SwapBaseInLog | SwapBaseOutLog | null {
  // Remove "ray_log:" prefix and clean the string
  const cleanLog = base64Log.replace('ray_log:', '').trim();

  // Decode base64 string to buffer
  const data = Buffer.from(cleanLog, 'base64');

  // Read log type from first byte
  const logType = data[0];
  let offset = 1;

  // Helper function to read uint64 values
  function readU64(): bigint {
    const value = data.readBigUInt64LE(offset);
    offset += 8;
    return value;
  }

  // Helper function to read uint128 values
  function readU128(): bigint {
    const value = data.readBigUInt64LE(offset);
    const valueHigh = data.readBigUInt64LE(offset + 8);
    offset += 16;
    return valueHigh * BigInt(2 ** 64) + value;
  }

  // Parse log based on its type
  switch (logType) {
    case LogType.Deposit:
      return {
        logType: LogType.Deposit,
        maxCoin: readU64(),
        maxPc: readU64(),
        base: readU64(),
        poolCoin: readU64(),
        poolPc: readU64(),
        poolLp: readU64(),
        calcPnlX: readU128(),
        calcPnlY: readU128(),
        deductCoin: readU64(),
        deductPc: readU64(),
        mintLp: readU64(),
      };

    case LogType.Withdraw:
      return {
        logType: LogType.Withdraw,
        withdrawLp: readU64(),
        userLp: readU64(),
        poolCoin: readU64(),
        poolPc: readU64(),
        poolLp: readU64(),
        calcPnlX: readU128(),
        calcPnlY: readU128(),
        outCoin: readU64(),
        outPc: readU64(),
      };

    case LogType.SwapBaseIn:
      return {
        logType: LogType.SwapBaseIn,
        amountIn: readU64(),
        minimumOut: readU64(),
        direction: readU64(),
        userSource: readU64(),
        poolCoin: readU64(),
        poolPc: readU64(),
        outAmount: readU64(),
      };

    case LogType.SwapBaseOut:
      return {
        logType: LogType.SwapBaseOut,
        maxIn: readU64(),
        amountOut: readU64(),
        direction: readU64(),
        userSource: readU64(),
        poolCoin: readU64(),
        poolPc: readU64(),
        deductIn: readU64(),
      };

    default:
      return null; //Unsupported log type
  }
}

// Helper function to parse swap operation details
function parseRaydiumSwapLog(log: SwapBaseInLog | SwapBaseOutLog) {
  const isBaseIn = 'amountIn' in log;
  const isBuy = log.direction === SWAP_DIRECTION.PC_TO_COIN;

  const operation = {
    type: isBuy ? 'Buy' : 'Sell',
    mode: isBaseIn ? 'Exact Input' : 'Exact Output',
    inputAmount: isBaseIn ? log.amountIn : log.deductIn,
    outputAmount: isBaseIn ? log.outAmount : log.amountOut,
    slippageProtection: isBaseIn ? log.minimumOut : log.maxIn,
  };

  return operation;
}

export {
  LogType,
  SWAP_DIRECTION,
  decodeRaydiumLog,
  parseRaydiumSwapLog,
  type DepositLog,
  type WithdrawLog,
  type SwapBaseInLog,
  type SwapBaseOutLog,
};
