export const DEX_PROGRAMS = {
  // DEX Aggregators
  JUPITER: {
    id: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
    name: 'Jupiter',
    tags: ['route'],
  },
  JUPITER_V4: {
    id: 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB',
    name: 'JupiterV4',
    tags: ['route'],
  },
  JUPITER_DCA: {
    id: 'DCA265Vj8a9CEuX1eb1LWRnDT7uK6q1xMipnNyatn23M',
    name: 'JupiterDCA',
    tags: ['route'],
  },
  JUPITER_DCA_KEEPER1: {
    id: 'DCAKxn5PFNN1mBREPWGdk1RXg5aVH9rPErLfBFEi2Emb',
    name: 'JupiterDcaKeeper1',
    tags: ['route'],
  },
  JUPITER_DCA_KEEPER2: {
    id: 'DCAKuApAuZtVNYLk3KTAVW9GLWVvPbnb5CxxRRmVgcTr',
    name: 'JupiterDcaKeeper2',
    tags: ['route'],
  },
  JUPITER_DCA_KEEPER3: {
    id: 'DCAK36VfExkPdAkYUQg6ewgxyinvcEyPLyHjRbmveKFw',
    name: 'JupiterDcaKeeper3',
    tags: ['route'],
  },
  JUPITER_LIMIT_ORDER_V2: {
    id: 'j1o2qRpjcyUwEvwtcfhEQefh773ZgjxcVRry7LDqg5X',
    name: 'JupiterLimitV2',
    tags: ['amm'],
  },
  JUPITER_VA: {
    id: 'VALaaymxQh2mNy2trH9jUqHT1mTow76wpTcGmSWSwJe',
    name: 'JupiterVA',
    tags: ['amm'],
  },
  OKX_DEX: {
    id: '6m2CDdhRgxpH4WjvdzxAYbGxwdGUz5MziiL5jek2kBma',
    name: 'OKX',
    tags: ['route'],
  },
  RAYDIUM_ROUTE: {
    id: 'routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS',
    name: 'RaydiumRoute',
    tags: ['route'],
  },
  SANCTUM: {
    id: 'stkitrT1Uoy18Dk1fTrgPw8W6MVzoCfYoAFT4MLsmhq',
    name: 'Sanctum',
    tags: ['route'],
  },

  // Major DEX Protocols
  RAYDIUM_V4: {
    id: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
    name: 'RaydiumV4',
    tags: ['amm'],
  },
  RAYDIUM_CPMM: {
    id: 'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C',
    name: 'RaydiumCPMM',
    tags: ['amm'],
  },
  RAYDIUM_CL: {
    id: 'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK',
    name: 'RaydiumCL',
    tags: ['amm'],
  },
  RAYDIUM_LCP: {
    id: 'LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj',
    name: 'RaydiumLaunchpad',
    tags: ['amm'],
  },
  ORCA: {
    id: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
    name: 'Orca',
    tags: ['amm'],
  },
  ORCA_V2: {
    id: '9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP',
    name: 'OrcaV2',
    tags: ['amm'],
  },
  ORCA_V1: {
    id: 'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1',
    name: 'OrcaV1',
    tags: ['amm'],
  },
  PHOENIX: {
    id: 'PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY',
    name: 'Phoenix',
    tags: ['route', 'amm'],
  },
  OPENBOOK: {
    id: 'opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb',
    name: 'Openbook',
    tags: ['amm'],
  },
  METEORA: {
    id: 'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo',
    name: 'MeteoraDLMM',
    tags: ['amm'],
  },
  METEORA_POOLS: {
    id: 'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB',
    name: 'MeteoraPools',
    tags: ['amm'],
  },

  // Vault Programs
  METEORA_VAULT: {
    id: '24Uqj9JCLxUeoC3hGfh5W3s9FM9uCHDS2SG3LYwBpyTi',
    name: 'MeteoraVault',
    tags: ['vault'],
  },
  STABBEL_VAULT: {
    id: 'vo1tWgqZMjG61Z2T9qUaMYKqZ75CYzMuaZ2LZP1n7HV',
    name: 'StabbleVault',
    tags: ['vault'],
  },

  // Trading Bot Programs
  BANANA_GUN: {
    id: 'BANANAjs7FJiPQqJTGFzkZJndT9o7UmKiYYGaJz6frGu',
    name: 'BananaGun',
    tags: ['bot'],
  },
  MINTECH: {
    id: 'minTcHYRLVPubRK8nt6sqe2ZpWrGDLQoNLipDJCGocY',
    name: 'Mintech',
    tags: ['bot'],
  },
  BLOOM: {
    id: 'b1oomGGqPKGD6errbyfbVMBuzSC8WtAAYo8MwNafWW1',
    name: 'Bloom',
    tags: ['bot'],
  },
  MAESTRO: {
    id: 'MaestroAAe9ge5HTc64VbBQZ6fP77pwvrhM8i1XWSAx',
    name: 'Maestro',
    tags: ['bot'],
  },
  NOVA: {
    id: 'NoVA1TmDUqksaj2hB1nayFkPysjJbFiU76dT4qPw2wm',
    name: 'Nova',
    tags: ['bot'],
  },
  APEPRO: {
    id: 'JSW99DKmxNyREQM14SQLDykeBvEUG63TeohrvmofEiw',
    name: 'Apepro',
    tags: ['bot'],
  },

  // Other DEX Protocols
  ALDRIN: {
    id: 'AMM55ShdkoGRB5jVYPjWziwk8m5MpwyDgsMWHaMSQWH6',
    name: 'Aldrin',
    tags: ['amm'],
  },
  ALDRIN_V2: {
    id: 'CURVGoZn8zycx6FXwwevgBTB2gVvdbGTEpvMJDbgs2t4',
    name: 'Aldrin V2',
    tags: ['amm'],
  },
  CREMA: {
    id: 'CLMM9tUoggJu2wagPkkqs9eFG4BWhVBZWkP1qv3Sp7tR',
    name: 'Crema',
    tags: ['amm'],
  },
  GOOSEFX: {
    id: 'GAMMA7meSFWaBXF25oSUgmGRwaW6sCMFLmBNiMSdbHVT',
    name: 'GooseFX GAMMA',
    tags: ['amm'],
  },
  LIFINITY: {
    id: 'EewxydAPCCVuNEyrVN68PuSYdQ7wKn27V9Gjeoi8dy3S',
    name: 'Lifinity',
    tags: ['amm'],
  },
  LIFINITY_V2: {
    id: '2wT8Yq49kHgDzXuPxZSaeLaH1qbmGXtEyPy64bL7aD3c',
    name: 'LifinityV2',
    tags: ['amm'],
  },
  MERCURIAL: {
    id: 'MERLuDFBMmsHnsBPZw2sDQZHvXFMwp8EdjudcU2HKky',
    name: 'Mercurial',
    tags: ['amm'],
  },
  MOONSHOT: {
    id: 'MoonCVVNZFSYkqNXP6bxHLPL6QQJiMagDL3qcqUQTrG',
    name: 'Moonshot',
    tags: ['amm'],
  },
  ONEDEX: {
    id: 'DEXYosS6oEGvk8uCDayvwEZz4qEyDJRf9nFgYCaqPMTm',
    name: '1Dex',
    tags: ['amm'],
  },
  PUMP_FUN: {
    id: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
    name: 'Pumpfun',
    tags: ['amm'],
  },
  PUMP_SWAP: {
    id: 'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA',
    name: 'Pumpswap',
    tags: ['amm'],
  },
  SABER: {
    id: 'SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ',
    name: 'Saber',
    tags: ['amm'],
  },
  SAROS: {
    id: 'SSwapUtytfBdBn1b9NUGG6foMVPtcWgpRU32HToDUZr',
    name: 'Saros',
    tags: ['amm'],
  },
  SOLFI: {
    id: 'SoLFiHG9TfgtdUXUjWAxi3LtvYuFyDLVhBWxdMZxyCe',
    name: 'SolFi',
    tags: ['amm'],
  },
  STABBEL: {
    id: 'swapNyd8XiQwJ6ianp9snpu4brUqFxadzvHebnAXjJZ',
    name: 'Stabble',
    tags: ['amm'],
  },
  STABBEL_WEIGHT: {
    id: 'swapFpHZwjELNnjvThjajtiVmkz3yPQEHjLtka2fwHW',
    name: 'StabbleWeight',
    tags: ['amm'],
  },
  BOOP_FUN: {
    id: 'boop8hVGQGqehUK2iVEMEnMrL5RbjywRzHKBmBE7ry4',
    name: 'Boopfun',
    tags: ['amm'],
  },
};

export const DEX_PROGRAM_IDS = Object.values(DEX_PROGRAMS).map((dex) => dex.id);

export const SYSTEM_PROGRAMS = [
  'ComputeBudget111111111111111111111111111111',
  '11111111111111111111111111111111',
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
  'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX', // openbook
];

export const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

/** Address of the SPL Token 2022 program */
export const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';

export const PUMPFUN_MIGRATORS = ['39azUYFWPz3VHgKCf3VChUwbpURdCHRxjWVowf5jUJjg'];

export const FEE_ACCOUNTS = [
  '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5', // Jitotip 1
  'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe', // Jitotip 2
  'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY', // Jitotip 3
  'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49', // Jitotip 4
  'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh', // Jitotip 5
  'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt', // Jitotip 6
  'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL', // Jitotip 7
  '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT', // Jitotip 8

  '39azUYFWPz3VHgKCf3VChUwbpURdCHRxjWVowf5jUJjg', // Pumpfun Migrator
  'FWsW1xNtWscwNmKv6wVsU1iTzRN6wmmk3MjxRP5tT7hz', // PumpfunAMM Fee1
  'G5UZAVbAf46s7cKWoyKu8kYTip9DGTpbLZ2qa9Aq69dP', // PumpfunAMM Fee2
  '7hTckgnGnLQR6sdH7YkqFTAA7VwTfYFaZ6EhEsU3saCX', // PumpfunAMM Fee3
  '9rPYyANsfQZw3DnDmKE3YCQF5E8oD89UXoHn9JFEhJUz', // PumpfunAMM Fee4
  '7VtfL8fvgNfhz17qKRMjzQEXgbdpnHHHQRh54R9jP2RJ', // PumpfunAMM Fee5
  'AVmoTthdrX6tKt4nDjco2D775W2YK3sDhxPcMmzUAmTY', // PumpfunAMM Fee6
  '62qc2CNXwrYqQScmEdiZFFAnJR262PxWEuNQtxfafNgV', // PumpfunAMM Fee7
  'JCRGumoE9Qi5BBgULTgdgTLjSgkCMSbF62ZZfGs84JeU', // PumpfunAMM Fee8

  'AVUCZyuT35YSuj4RH7fwiyPu82Djn2Hfg7y2ND2XcnZH', // Photon Fee Vault
];
