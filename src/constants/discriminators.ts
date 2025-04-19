// Instruction Discriminators
export const DISCRIMINATORS = {
  JUPITER: {
    ROUTE_EVENT: new Uint8Array([228, 69, 165, 46, 81, 203, 154, 29, 64, 198, 205, 232, 38, 8, 113, 226]),
  },
  PUMPFUN: {
    TRADE_EVENT: new Uint8Array([228, 69, 165, 46, 81, 203, 154, 29, 189, 219, 127, 211, 78, 230, 97, 238]),
    CREATE_EVENT: new Uint8Array([228, 69, 165, 46, 81, 203, 154, 29, 27, 114, 169, 77, 222, 235, 99, 118]),
    COMPLETE_EVENT: new Uint8Array([228, 69, 165, 46, 81, 203, 154, 29, 95, 114, 97, 156, 212, 46, 152, 8]),
    BUY: new Uint8Array([102, 6, 61, 18, 1, 218, 235, 234]),
    SELL: new Uint8Array([51, 230, 133, 164, 1, 127, 131, 173]), // SELL
  },
  PUMPSWAP: {
    CREATE_POOL: new Uint8Array([228, 69, 165, 46, 81, 203, 154, 29, 177, 49, 12, 210, 160, 118, 167, 116]),
    ADD_LIQUIDITY: new Uint8Array([228, 69, 165, 46, 81, 203, 154, 29, 120, 248, 61, 83, 31, 142, 107, 144]),
    REMOVE_LIQUIDITY: new Uint8Array([228, 69, 165, 46, 81, 203, 154, 29, 22, 9, 133, 26, 160, 44, 71, 192]),
    BUY: new Uint8Array([228, 69, 165, 46, 81, 203, 154, 29, 103, 244, 82, 31, 44, 245, 119, 119]),
    SELL: new Uint8Array([228, 69, 165, 46, 81, 203, 154, 29, 62, 47, 55, 10, 165, 3, 220, 42]), // SELL
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
  RAYDIUM_LCP: {
    CREATE_EVENT: new Uint8Array([228, 69, 165, 46, 81, 203, 154, 29, 151, 215, 226, 9, 118, 161, 115, 174]), // PoolCreateEvent
    TRADE_EVENT: new Uint8Array([228, 69, 165, 46, 81, 203, 154, 29, 189, 219, 127, 211, 78, 230, 97, 238]), // TradeEvent
    MIGRATE_TO_AMM: new Uint8Array([207, 82, 192, 145, 254, 207, 145, 223]), // complete: migrate_to_amm
    MIGRATE_TO_CPSWAP: new Uint8Array([136, 92, 200, 103, 28, 218, 144, 140]), // complete: migrate_to_cpswap
    BUY_EXACT_IN: new Uint8Array([250, 234, 13, 123, 213, 156, 19, 236]), // buyExactIn
    BUY_EXACT_OUT: new Uint8Array([24, 211, 116, 40, 105, 3, 153, 56]), // buyExactOut
    SELL_EXACT_IN: new Uint8Array([149, 39, 222, 155, 211, 124, 152, 26]), // sellExactIn
    SELL_EXACT_OUT: new Uint8Array([95, 200, 71, 34, 8, 9, 11, 166]), // sellExactOut
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
