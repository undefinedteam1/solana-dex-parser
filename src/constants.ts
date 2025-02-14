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
    name: "Meteora",
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
} as const;
