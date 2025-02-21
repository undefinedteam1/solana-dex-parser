export const DEX_PROGRAMS = {
  // Core DEX Programs
  JUPITER: {
    id: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
    name: "Jupiter",
  },
  JUPITER_DCA: {
    id: "DCAK36VfExkPdAkYUQg6ewgxyinvcEyPLyHjRbmveKFw",
    name: "Jupiter DCA",
  },
  PUMP_FUN: {
    id: "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
    name: "PumpFun",
  },
  PHOENIX: {
    id: "PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY",
    name: "Phoenix",
  },

  // Trading Bot Programs
  BANANA_GUN: {
    id: "BANANAjs7FJiPQqJTGFzkZJndT9o7UmKiYYGaJz6frGu",
    name: "Banana Gun",
  },
  MINTECH: {
    id: "minTcHYRLVPubRK8nt6sqe2ZpWrGDLQoNLipDJCGocY",
    name: "Mintech",
  },
  BLOOM: {
    id: "b1oomGGqPKGD6errbyfbVMBuzSC8WtAAYo8MwNafWW1",
    name: "Bloom",
  },
  MAESTRO: {
    id: "MaestroAAe9ge5HTc64VbBQZ6fP77pwvrhM8i1XWSAx",
    name: "Maestro",
  },
  NOVA: {
    id: "NoVA1TmDUqksaj2hB1nayFkPysjJbFiU76dT4qPw2wm",
    name: "Nova",
  },

  // DEX Protocol Programs
  RAYDIUM_V4: {
    id: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
    name: "Raydium v4",
  },
  RAYDIUM_AMM: {
    id: "routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS",
    name: "Raydium AMM",
  },
  RAYDIUM_CPMM: {
    id: "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C",
    name: "Raydium CPMM",
  },
  RAYDIUM_CL: {
    id: "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK",
    name: "Raydium CL",
  },
  METEORA: {
    id: "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo",
    name: "Meteora", //DLMM
  },
  METEORA_POOLS: {
    id: "Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB",
    name: "Meteora Pools",
  },
  MOONSHOT: {
    id: "MoonCVVNZFSYkqNXP6bxHLPL6QQJiMagDL3qcqUQTrG",
    name: "Moonshot",
  },
  ORCA: {
    id: "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",
    name: "Orca",
  },
  OKX_DEX: {
    id: "6m2CDdhRgxpH4WjvdzxAYbGxwdGUz5MziiL5jek2kBma",
    name: "OKX DEX",
  },
};

export const SYSTEM_PROGRAMS = [
  "ComputeBudget111111111111111111111111111111",
  "11111111111111111111111111111111",
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
];

export const PUMPFUN_MIGRATORS = [
  "39azUYFWPz3VHgKCf3VChUwbpURdCHRxjWVowf5jUJjg",
];

// Known token addresses
export const TOKENS = {
  SOL: "So11111111111111111111111111111111111111112", // Wrapped SOL
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
};

export const TOKEN_DECIMALS = {
  [TOKENS.SOL]: 9,
  [TOKENS.USDC]: 6,
  [TOKENS.USDT]: 6,
};

// Instruction Discriminators
export const DISCRIMINATORS = {
  JUPITER: {
    ROUTE_EVENT: new Uint8Array([
      228, 69, 165, 46, 81, 203, 154, 29, 64, 198, 205, 232, 38, 8, 113, 226,
    ]),
  },
  PUMPFUN: {
    TRADE_EVENT: new Uint8Array([
      228, 69, 165, 46, 81, 203, 154, 29, 189, 219, 127, 211, 78, 230, 97, 238,
    ]),
    CREATE_EVENT: new Uint8Array([
      228, 69, 165, 46, 81, 203, 154, 29, 27, 114, 169, 77, 222, 235, 99, 118,
    ]),
    COMPLETE_EVENT: new Uint8Array([
      228, 69, 165, 46, 81, 203, 154, 29, 95, 114, 97, 156, 212, 46, 152, 8,
    ]),
  },
  MOONSHOT: {
    BUY: new Uint8Array([102, 6, 61, 18, 1, 218, 235, 234]),
    SELL: new Uint8Array([51, 230, 133, 164, 1, 127, 131, 173]),
  },
  RAYDIUM: {
    CREATE: new Uint8Array([1, 254, 0, 0, 0, 0, 0, 0]),
    ADD_LIQUIDITY: new Uint8Array([3, 245, 154, 82, 5, 0, 0, 0]),
    REMOVE_LIQUIDITY: new Uint8Array([4, 18, 194, 31, 96, 8, 2, 0]),
  },
  RAYDIUM_CL: {
    CREATE: new Uint8Array([77, 255, 174, 82, 125, 29, 201, 46]), // openPositionWithToken22Nft
    ADD_LIQUIDITY: new Uint8Array([133, 29, 89, 223, 69, 238, 176, 10]), // increaseLiquidityV2
    REMOVE_LIQUIDITY: new Uint8Array([58, 127, 188, 62, 79, 82, 196, 96]), // decreaseLiquidityV2
  },
  RAYDIUM_CPMM: {
    CREATE: new Uint8Array([175, 175, 109, 31, 13, 152, 155, 237]), // initialize
    ADD_LIQUIDITY: new Uint8Array([242, 35, 198, 137, 82, 225, 242, 182]), // deposit
    REMOVE_LIQUIDITY: new Uint8Array([183, 18, 70, 156, 148, 109, 161, 34]), // withdraw
  },
  METEORA_DLMM: {
    CREATE: new Uint8Array([7, 3, 150, 127, 148, 40, 61, 200]), // addLiquidityByStrategy
    ADD_LIQUIDITY: new Uint8Array([7, 3, 150, 127, 148, 40, 61, 200]), // addLiquidityByStrategy
    REMOVE_LIQUIDITY: new Uint8Array([26, 82, 102, 152, 240, 74, 105, 26]), // removeLiquidityByRange
  },
  METEORA_POOLS: {
    CREATE: new Uint8Array([7, 166, 138, 171, 206, 171, 236, 244]), // initializePermissionlessConstantProductPoolWithConfig
    ADD_LIQUIDITY: new Uint8Array([168, 227, 50, 62, 189, 171, 84, 176]), // addBalanceLiquidity
    REMOVE_LIQUIDITY: new Uint8Array([133, 109, 44, 179, 56, 238, 114, 33]), // removeBalanceLiquidity
  },
  ORCA: {
    CREATE: new Uint8Array([242, 29, 134, 48, 58, 110, 14, 60]), // openPositionWithMetadata
    CREATE2: new Uint8Array([212, 47, 95, 92, 114, 102, 131, 250]), // openPositionWithTokenExtensions
    ADD_LIQUIDITY: new Uint8Array([46, 156, 243, 118, 13, 205, 251, 178]), // increaseLiquidity
    ADD_LIQUIDITY2: new Uint8Array([133, 29, 89, 223, 69, 238, 176, 10]), // increaseLiquidityV2
    REMOVE_LIQUIDITY: new Uint8Array([160, 38, 208, 111, 104, 91, 44, 1]), // decreaseLiquidity
  },
} as const;
