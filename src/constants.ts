export const DEX_PROGRAMS = {
  // Core DEX Programs
  JUPITER: {
    id: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
    name: 'Jupiter',
  },
  JUPITER_DCA: {
    id: 'DCAK36VfExkPdAkYUQg6ewgxyinvcEyPLyHjRbmveKFw',
    name: 'JupiterDCA',
  },
  PUMP_FUN: {
    id: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
    name: 'Pumpfun',
  },
  PHOENIX: {
    id: 'PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY',
    name: 'Phoenix',
  },

  // Trading Bot Programs
  BANANA_GUN: {
    id: 'BANANAjs7FJiPQqJTGFzkZJndT9o7UmKiYYGaJz6frGu',
    name: 'BananaGun',
  },
  MINTECH: {
    id: 'minTcHYRLVPubRK8nt6sqe2ZpWrGDLQoNLipDJCGocY',
    name: 'Mintech',
  },
  BLOOM: {
    id: 'b1oomGGqPKGD6errbyfbVMBuzSC8WtAAYo8MwNafWW1',
    name: 'Bloom',
  },
  MAESTRO: {
    id: 'MaestroAAe9ge5HTc64VbBQZ6fP77pwvrhM8i1XWSAx',
    name: 'Maestro',
  },
  NOVA: {
    id: 'NoVA1TmDUqksaj2hB1nayFkPysjJbFiU76dT4qPw2wm',
    name: 'Nova',
  },

  // DEX Protocol Programs
  RAYDIUM_V4: {
    id: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
    name: 'Raydiumv4',
  },
  RAYDIUM_AMM: {
    id: 'routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS',
    name: 'RaydiumRoute',
  },
  RAYDIUM_CPMM: {
    id: 'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C',
    name: 'RaydiumCPMM',
  },
  RAYDIUM_CL: {
    id: 'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK',
    name: 'RaydiumCL',
  },
  METEORA: {
    id: 'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo',
    name: 'Meteora', //DLMM
  },
  METEORA_POOLS: {
    id: 'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB',
    name: 'MeteoraPools',
  },
  MOONSHOT: {
    id: 'MoonCVVNZFSYkqNXP6bxHLPL6QQJiMagDL3qcqUQTrG',
    name: 'Moonshot',
  },
  ORCA: {
    id: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
    name: 'Orca',
  },
  OKX_DEX: {
    id: '6m2CDdhRgxpH4WjvdzxAYbGxwdGUz5MziiL5jek2kBma',
    name: 'OKX',
  },
};

export const SYSTEM_PROGRAMS = [
  'ComputeBudget111111111111111111111111111111',
  '11111111111111111111111111111111',
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
];

export const PUMPFUN_MIGRATORS = ['39azUYFWPz3VHgKCf3VChUwbpURdCHRxjWVowf5jUJjg'];

// Known token addresses
export const TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112', // Wrapped SOL
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
};

export const TOKEN_DECIMALS = {
  [TOKENS.SOL]: 9,
  [TOKENS.USDC]: 6,
  [TOKENS.USDT]: 6,
};

// Instruction Discriminators
export const DISCRIMINATORS = {
  JUPITER: {
    ROUTE_EVENT: new Uint8Array([228, 69, 165, 46, 81, 203, 154, 29, 64, 198, 205, 232, 38, 8, 113, 226]),
  },
  PUMPFUN: {
    TRADE_EVENT: new Uint8Array([228, 69, 165, 46, 81, 203, 154, 29, 189, 219, 127, 211, 78, 230, 97, 238]),
    CREATE_EVENT: new Uint8Array([228, 69, 165, 46, 81, 203, 154, 29, 27, 114, 169, 77, 222, 235, 99, 118]),
    COMPLETE_EVENT: new Uint8Array([228, 69, 165, 46, 81, 203, 154, 29, 95, 114, 97, 156, 212, 46, 152, 8]),
  },
  MOONSHOT: {
    BUY: new Uint8Array([102, 6, 61, 18, 1, 218, 235, 234]),
    SELL: new Uint8Array([51, 230, 133, 164, 1, 127, 131, 173]),
  },
  RAYDIUM: {
    CREATE: new Uint8Array([1]),
    ADD_LIQUIDITY: new Uint8Array([3]),
    REMOVE_LIQUIDITY: new Uint8Array([4]),
  },
  RAYDIUM_CL: {
    CREATE: {
      openPosition: new Uint8Array([135, 128, 47, 77, 15, 152, 240, 49]), // openPosition
      openPositionV2: new Uint8Array([77, 184, 74, 214, 112, 86, 241, 199]), // openPositionV2
      openPositionWithToken22Nft: new Uint8Array([77, 255, 174, 82, 125, 29, 201, 46]), // openPositionWithToken22Nft
    },
    ADD_LIQUIDITY: {
      increaseLiquidity: new Uint8Array([46, 156, 243, 118, 13, 205, 251, 178]), // increaseLiquidity
      increaseLiquidityV2: new Uint8Array([133, 29, 89, 223, 69, 238, 176, 10]), // increaseLiquidityV2
    },
    REMOVE_LIQUIDITY: {
      decreaseLiquidity: new Uint8Array([160, 38, 208, 111, 104, 91, 44, 1]), // decreaseLiquidity
      decreaseLiquidityV2: new Uint8Array([58, 127, 188, 62, 79, 82, 196, 96]), // decreaseLiquidityV2
    },
  },
  RAYDIUM_CPMM: {
    CREATE: new Uint8Array([175, 175, 109, 31, 13, 152, 155, 237]), // initialize
    ADD_LIQUIDITY: new Uint8Array([242, 35, 198, 137, 82, 225, 242, 182]), // deposit
    REMOVE_LIQUIDITY: new Uint8Array([183, 18, 70, 156, 148, 109, 161, 34]), // withdraw
  },
  METEORA_DLMM: {
    ADD_LIQUIDITY: {
      addLiquidity: new Uint8Array([181, 157, 89, 67, 143, 182, 52, 72]), //addLiquidity
      addLiquidityByStrategy: new Uint8Array([7, 3, 150, 127, 148, 40, 61, 200]), // addLiquidityByStrategy
      addLiquidityByStrategyOneSide: new Uint8Array([41, 5, 238, 175, 100, 225, 6, 205]), //addLiquidityByStrategyOneSide
      addLiquidityOneSide: new Uint8Array([94, 155, 103, 151, 70, 95, 220, 165]), //addLiquidityOneSide
      addLiquidityOneSidePrecise: new Uint8Array([161, 194, 103, 84, 171, 71, 250, 154]), //addLiquidityOneSidePrecise
      addLiquidityByWeight: new Uint8Array([28, 140, 238, 99, 231, 162, 21, 149]), //addLiquidityByWeight
    },
    REMOVE_LIQUIDITY: {
      removeLiquidity: new Uint8Array([80, 85, 209, 72, 24, 206, 177, 108]), //removeLiquidity
      removeLiquidityByRange: new Uint8Array([26, 82, 102, 152, 240, 74, 105, 26]), // removeLiquidityByRange
      removeAllLiquidity: new Uint8Array([10, 51, 61, 35, 112, 105, 24, 85]), // removeAllLiquidity
    },
    OTHERS: {
      claimFee: new Uint8Array([169, 32, 79, 137, 136, 232, 70, 137]), //claimFee
    },
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
    OTHER1: new Uint8Array([164, 152, 207, 99, 30, 186, 19, 182]), // collectFees
    OTHER2: new Uint8Array([70, 5, 132, 87, 86, 235, 177, 34]), //collectReward
  },
} as const;
