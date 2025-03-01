import { Connection } from '@solana/web3.js';
import dotenv from 'dotenv';
import { DexParser } from '../dex-parser';
import * as https from 'node:https';

dotenv.config();

const tests = [
  {
    type: 'BUY',
    inputToken: {
      mint: 'So11111111111111111111111111111111111111112',
      amount: 2.641929796,
      decimals: 9
    },
    outputToken: {
      mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
      amount: 229.028548,
      decimals: 6
    },
    user: 'MfDuWeqSHEqTFVYZ7LoexgAK9dxk7cy4DFJWjWMGVWa',
    programId: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
    amm: 'Orca',
    slot: 282651787,
    timestamp: 1723260503,
    signature: '2kAW5GAhPZjM3NoSrhJVHdEpwjmq9neWtckWnjopCfsmCGB27e3v2ZyMM79FdsL4VWGEtYSFi1sF1Zhs7bqdoaVT',
    idx: '3-0'
  },
  {
    type: 'BUY',
    inputToken: {
      mint: 'So11111111111111111111111111111111111111112',
      amount: 2,
      decimals: 9
    },
    outputToken: {
      mint: 'B9Z9mKUoVy5k8KuL2HauUD1mhmfF3PPNnJoK83S1pump',
      amount: 67062499.999999,
      decimals: 6
    },
    user: 'Bo4dMz6pZfbeZmb7kNs4aBL7Usmr8rpiu1UVTvsPuJeG',
    programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
    amm: 'Pumpfun',
    slot: 282653703,
    timestamp: 1723261303,
    signature: '4Cod1cNGv6RboJ7rSB79yeVCR4Lfd25rFgLY3eiPJfTJjTGyYP1r2i1upAYZHQsWDqUbGd1bhTRm1bpSQcpWMnEz',
    idx: '5-3'
  },
  {
    type: 'BUY',
    inputToken: {
      mint: 'So11111111111111111111111111111111111111112',
      amount: 3.038311959,
      decimals: 9
    },
    outputToken: {
      mint: '6JXCZH8VjYcsYoo1qBuH7yBm2PcHdRENFVLCEmBSkk1z',
      amount: 7595301.767757,
      decimals: 6
    },
    user: 'Fxo38e3EGQXUeUhzFiNJVEFM4uMqLuMAAioa1mFLwJF5',
    programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
    amm: 'Pumpfun',
    slot: 320598533,
    timestamp: 1739536394,
    signature: 'v8s37Srj6QPMtRC1HfJcrSenCHvYebHiGkHVuFFiQ6UviqHnoVx4U77M3TZhQQXewXadHYh5t35LkesJi3ztPZZ',
    idx: '5-4'
  },
  {
    type: 'SELL',
    inputToken: {
      mint: 'Em4rcuhX6STfB7mxb66dUXDmZPYCjDiQFthvzSzpump',
      amount: 10033911.529351,
      decimals: 6
    },
    outputToken: {
      mint: 'So11111111111111111111111111111111111111112',
      amount: 75.985257135,
      decimals: 9
    },
    user: 'GzNus5Ka6kjJrqKCJRHmEVLiAS3HJ9RrBp1mdnxqGXTb',
    programId: 'BANANAjs7FJiPQqJTGFzkZJndT9o7UmKiYYGaJz6frGu',
    amm: 'BananaGun',
    route: 'BananaGun > RaydiumV4',
    slot: 296275071,
    timestamp: 1729236707,
    signature: 'oXUd22GQ1d45a6XNzfdpHAX6NfFEfFa9o2Awn2oimY89Rms3PmXL1uBJx3CnTYjULJw6uim174b3PLBFkaAxKzK',
    idx: '3-1'
  },
  {
    type: 'SELL',
    inputToken: {
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      amount: 1723.78144,
      decimals: 6
    },
    outputToken: {
      mint: 'So11111111111111111111111111111111111111112',
      amount: 11.115796348,
      decimals: 9
    },
    user: 'GgcyBeJMu3q9KKXyh42doDfArqRxajU5pvvGPbj3ApyY',
    programId: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
    amm: 'Jupiter',
    route: 'Jupiter > Orca',
    slot: 282691871,
    timestamp: 1723277314,
    signature: 'DBctXdTTtvn7Rr4ikeJFCBz4AtHmJRyjHGQFpE59LuY3Shb7UcRJThAXC7TGRXXskXuu9LEm9RqtU6mWxe5cjPF',
    idx: '1-0'
  },
  {
    type: 'SELL',
    inputToken: {
      mint: '2JcXacFwt9mVAwBQ5nZkYwCyXQkRcdsYrDXn6hj22SbP',
      amount: 5251.919261,
      decimals: 6
    },
    outputToken: {
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      amount: 45.461595,
      decimals: 6
    },
    user: '4tjna1iSvWjWL5sSzWYPDx4goVCDcU2sZFEnFeKPMGEE',
    programId: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
    amm: 'Jupiter', // DCA
    slot: 286706822,
    timestamp: 1725003810,
    signature: '4mxr44yo5Qi7Rabwbknkh8MNUEWAMKmzFQEmqUVdx5JpHEEuh59TrqiMCjZ7mgZMozRK1zW8me34w8Myi8Qi1tWP',
    idx: '2-1'
  },
  {
    type: 'BUY',
    inputToken: {
      mint: 'So11111111111111111111111111111111111111112',
      amount: 1.618569551,
      decimals: 9
    },
    outputToken: {
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      amount: 250.054777,
      decimals: 6
    },
    user: 'MfDuWeqSHEqTFVYZ7LoexgAK9dxk7cy4DFJWjWMGVWa',
    programId: 'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo',
    amm: 'Meteora',
    slot: 282654585,
    timestamp: 1723261671,
    signature: '125MRda3h1pwGZpPRwSRdesTPiETaKvy4gdiizyc3SWAik4cECqKGw2gggwyA1sb2uekQVkupA2X9S4vKjbstxx3',
    idx: '3-0'
  },
  {
    type: 'SELL',
    inputToken: {
      mint: '5bpj3W9zC2Y5Zn2jDBcYVscGnCBUN5RD7152cfL9pump',
      amount: 38202.111872,
      decimals: 6
    },
    outputToken: {
      mint: 'So11111111111111111111111111111111111111112',
      amount: 1.12583975,
      decimals: 9
    },
    user: 'AkQWv1Qnvua6zJch9JrFe8a9YVE4QxCkvc3dgmHvc4Qn',
    programId: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
    amm: 'Raydiumv4',
    slot: 282701231,
    timestamp: 1723281240,
    signature: '5kaAWK5X9DdMmsWm6skaUXLd6prFisuYJavd9B62A941nRGcrmwvncg3tRtUfn7TcMLsrrmjCChdEjK3sjxS6YG9',
    idx: '4-0'
  },
  {
    type: 'BUY',
    inputToken: {
      mint: 'So11111111111111111111111111111111111111112',
      amount: 0.02,
      decimals: 9
    },
    outputToken: {
      mint: '7atgF8KQo4wJrD5ATGX7t1V2zVvykPJbFfNeVf1icFv1',
      amount: 3907930.06,
      decimals: 2
    },
    user: '2cuQnU6tbA8auRmjJTj8JqNvRnG7PNAYMJXZqiPqRwwU',
    programId: 'routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS',
    amm: 'RaydiumRoute',
    route: 'RaydiumRoute > Raydium CPMM',
    slot: 289984406,
    timestamp: 1726421764,
    signature: '51nj5GtAmDC23QkeyfCNfTJ6Pdgwx7eq4BARfq1sMmeEaPeLsx9stFA3Dzt9MeLV5xFujBgvghLGcayC3ZevaQYi',
    idx: '1-6',
  },
  {
    type: 'BUY',
    inputToken: {
      mint: 'So11111111111111111111111111111111111111112',
      amount: 146.52,
      decimals: 9
    },
    outputToken: {
      mint: 'UwU8RVXB69Y6Dcju6cN2Qef6fykkq6UUNpB15rZku6Z',
      amount: 10619547.417607,
      decimals: 6
    },
    user: '8deJ9xeUvXSJwicYptA9mHsU2rN2pDx37KWzkDkEXhU6',
    programId: 'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C',
    amm: 'RaydiumCPMM',
    slot: 283070871,
    timestamp: 1723436146,
    signature: 'afUCiFQ6amxuxx2AAwsghLt7Q9GYqHfZiF4u3AHhAzs8p1ThzmrtSUFMbcdJy8UnQNTa35Fb1YqxR6F9JMZynYp',
    idx: '4-0'
  },
  {
    type: 'SELL',
    inputToken: {
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      amount: 562.5,
      decimals: 6
    },
    outputToken: {
      mint: 'So11111111111111111111111111111111111111112',
      amount: 3.869612214,
      decimals: 9
    },
    user: 'MfDuWeqSHEqTFVYZ7LoexgAK9dxk7cy4DFJWjWMGVWa',
    programId: 'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK',
    amm: 'RaydiumCL',
    slot: 283114296,
    timestamp: 1723454315,
    signature: '2durZHGFkK4vjpWFGc5GWh5miDs8ke8nWkuee8AUYJA8F9qqT2Um76Q5jGsbK3w2MMgqwZKbnENTLWZoi3d6o2Ds',
    idx: '3-0'
  },
  {
    type: 'BUY',
    inputToken: {
      mint: 'So11111111111111111111111111111111111111112',
      amount: 1.821750982,
      decimals: 9
    },
    outputToken: {
      mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      amount: 264.874515,
      decimals: 6
    },
    user: 'CZ4SEAnHHgHr4X4PxuM1LQPwr1592KDu1MmZhypfjKjL',
    programId: 'AP51WLiiqTdbZfgyRMs35PsZpdmLuPDdHYmrB23pEtMU',
    amm:  'RaydiumCL',
    route: 'Unknow > RaydiumCL',
    slot: 283114296,
    timestamp: 1723454315,
    signature: '4MSVpVBwxnYTQSF3bSrAB99a3pVr6P6bgoCRDsrBbDMA77WeQqoBDDDXqEh8WpnUy5U4GeotdCG9xyExjNTjYE1u',
    idx: '2-0',
    items: [
      {
        type: 'SELL',
        inputToken: {
          mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
          amount: 264.874515,
          decimals: 6
        },
        outputToken: {
          mint: 'So11111111111111111111111111111111111111112',
          amount: 1.822062295,
          decimals: 9
        },
        user: 'CZ4SEAnHHgHr4X4PxuM1LQPwr1592KDu1MmZhypfjKjL',
        programId: 'AP51WLiiqTdbZfgyRMs35PsZpdmLuPDdHYmrB23pEtMU',
        amm: 'Orca',
        slot: 283114296,
        timestamp: 1723454315,
        signature: '4MSVpVBwxnYTQSF3bSrAB99a3pVr6P6bgoCRDsrBbDMA77WeQqoBDDDXqEh8WpnUy5U4GeotdCG9xyExjNTjYE1u',
        idx: '2-5',
      }
    ]
  },
  {
    type: 'BUY',
    inputToken: {
      mint: 'So11111111111111111111111111111111111111112',
      amount: 5,
      decimals: 9
    },
    outputToken: {
      mint: '8SCRpzEGhWmZpnR8HUtS8h9M2fZH4ztw2dULrmTLpump',
      amount: 7129260.999156,
      decimals: 6
    },
    user: '5fprK2GKVWvrLTH6QzfmsNnFx4XJSFHc9Da7DDMshqbK',
    programId: 'MaestroAAe9ge5HTc64VbBQZ6fP77pwvrhM8i1XWSAx',
    amm: 'Maestro',
    route: 'Maestro > RaydiumV4',
    slot: 302169909,
    timestamp: 1731947514,
    signature: 'mWaH4FELcPj4zeY4Cgk5gxUirQDM7yE54VgMEVaqiUDQjStyzwNrxLx4FMEaKEHQoYsgCRhc1YdmBvhGDRVgRrq',
    idx: '2-8'
  },
  {
    type: 'SELL',
    inputToken: {
      mint: '21eBXA2uqksji57RuvYCQTCu1tWGRVJetYz952qdjWPb',
      amount: 34075.46671676,
      decimals: 8
    },
    outputToken: {
      mint: 'So11111111111111111111111111111111111111112',
      amount: 3.342436354,
      decimals: 9
    },
    user: '6S81qVJJjJjzEp69crBBX8q3mYErpgPRqWXz4o8qxMuQ',
    programId: 'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo',
    amm: 'Meteora',
    slot: 322676235,
    timestamp: 1740359581,
    signature: '7YPF21r7JBDeoXuMJn6KSqDVYGrm821U87Cnje3xPvZpMUVaAEAvCGJPP6va2b5oMLAzGku5s3TcNAsN6zdXPRn',
    idx: '7-0',
    items: [{
      type: 'BUY',
      inputToken: {
        mint: 'So11111111111111111111111111111111111111112',
        amount: 0.001185987,
        decimals: 9
      },
      outputToken: {
        mint: '21eBXA2uqksji57RuvYCQTCu1tWGRVJetYz952qdjWPb',
        amount: 10.80316957,
        decimals: 8
      },
      user: '6S81qVJJjJjzEp69crBBX8q3mYErpgPRqWXz4o8qxMuQ',
      programId: 'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo',
      amm: 'Meteora',
      slot: 322676235,
      timestamp: 1740359581,
      signature: '7YPF21r7JBDeoXuMJn6KSqDVYGrm821U87Cnje3xPvZpMUVaAEAvCGJPP6va2b5oMLAzGku5s3TcNAsN6zdXPRn',
      idx: '17-0'
    }]
  },
  {
    type: 'BUY',
    inputToken: {
      mint: 'So11111111111111111111111111111111111111112',
      amount: 1,
      decimals: 9
    },
    outputToken: {
      mint: '7G5DM7Jy7TMWKgH313tA3vF6AqHpbHP4TWZzpTVLWv9c',
      amount: 21500.097493,
      decimals: 6
    },
    user: 'D946cRZP4KiwXvfcxYhoC11boWyA5np5Y8AFhEQ2AftE',
    programId: 'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB',
    amm: 'MeteoraPools',
    slot: 282652735,
    timestamp: 1723260900,
    signature: '4uuw76SPksFw6PvxLFkG9jRyReV1F4EyPYNc3DdSECip8tM22ewqGWJUaRZ1SJEZpuLJz1qPTEPb2es8Zuegng9Z',
    idx: '6-0',
  },
  {
    type: 'BUY',
    inputToken: {
      mint: 'So11111111111111111111111111111111111111112',
      amount: 0.0050445,
      decimals: 9
    },
    outputToken: {
      mint: 'DpFmJ6tCTmmnXFAy4qMujKuDd9Z86g7ecFqu75tktYYE',
      amount: 172904.389391231,
      decimals: 9
    },
    user: '49osHzF9JaUUoRwCrx8ntvQnjsGVoc12Q8vmaVRUHAiS',
    programId: 'MoonCVVNZFSYkqNXP6bxHLPL6QQJiMagDL3qcqUQTrG',
    amm: 'Moonshot',
    slot: 289406474,
    timestamp: 1726168688,
    signature: 'AhiFQX1Z3VYbkKQH64ryPDRwxUv8oEPzQVjSvT7zY58UYDm4Yvkkt2Ee9VtSXtF6fJz8fXmb5j3xYVDF17Gr9CG',
    idx: '1-0'
  },
  {
    type: 'SELL',
    inputToken: {
      mint: 'CQn88snXCipTxn6DBbwgSA7d9v1sXPmyxzCNNiVNXzFy',
      amount: 59948049.31224611,
      decimals: 9
    },
    outputToken: {
      mint: 'So11111111111111111111111111111111111111112',
      amount: 1.711486459,
      decimals: 9
    },
    user: '4k8WHszi2uBzTiypTKUYH1hzYkUBCARPPn6ZjPNMhDoc',
    programId: 'MoonCVVNZFSYkqNXP6bxHLPL6QQJiMagDL3qcqUQTrG',
    amm: 'Moonshot',
    slot: 292197608,
    timestamp: 1727392090,
    signature: '2XYu86VrUXiwNNj8WvngcXGytrCsSrpay69Rt3XBz9YZvCQcZJLjvDfh9UWETFtFW47vi4xG2CkiarRJwSe6VekE',
    idx: '2-0'
  },
  {
    type: 'SELL',
    inputToken: {
      mint: 'BkzZCdsW66wjtmpEdpn9s27Qg4bYZ3oL8WUmzKriA57A',
      amount: 3067322.827190042,
      decimals: 9
    },
    outputToken: {
      mint: '8nzCP3xmkpKAq2un87d6Jgg4r3JnvgUSkFemfLbFpump',
      amount: 83946.888435,
      decimals: 6
    },
    user: '5ww7fD9sqqspTeQQ9ryq9DUpnYC51CaDtUzJEnNt1NYs',
    programId: '6m2CDdhRgxpH4WjvdzxAYbGxwdGUz5MziiL5jek2kBma',
    amm: 'OKX',
    route: "Raydium OKX > SOL",
    slot: 311404856,
    timestamp: 1735821916,
    signature: '5xaT2SXQUyvyLGsnyyoKMwsDoHrx1enCKofkdRMdNaL5MW26gjQBM3AWebwjTJ49uqEqnFu5d9nXJek6gUSGCqbL',
    idx: '3-1',
    test: true,
  },
  {
    type: 'SELL',
    inputToken: {
      mint: 'DeiZk6A4eqD8iANsdEwP2EyCHzAdWfWyYQcgNGiXpump',
      amount: 75721.220573,
      decimals: 6
    },
    outputToken: {
      mint: 'So11111111111111111111111111111111111111112',
      amount: 0.080774072,
      decimals: 9
    },
    user: 'D93baoyk5TGQXL1vQdrrthQHDxJidJDVARafqujL5bY3',
    programId: '6m2CDdhRgxpH4WjvdzxAYbGxwdGUz5MziiL5jek2kBma',
    amm: 'OKX',
    route: 'OKX > RaydiumV4',
    slot: 323178325,
    timestamp: 1740558283,
    signature: '53tdwmNWEp9KsyegiDk7Z3DXVfSQoBXpAJfZbpAUTwzCtDkfrbdCN17ksQnKdH2p9yBTrYHGhTvHrckaPCSshBkU',
    idx: '4-1'
  },
  {
    type: 'SELL',
    inputToken: {
      mint: '2sNenpKt7a2wr6sbYoP5FCoyz6MtK3gK1eips2X7pump',
      amount: 1450332.526984,
      decimals: 6
    },
    outputToken: {
      mint: 'So11111111111111111111111111111111111111112',
      amount: 2.98492783,
      decimals: 9
    },
    user: 'CGL9gGUXaoeK25nakwLADzfMii99GCgmhVtreqdL98j7',
    programId: '6m2CDdhRgxpH4WjvdzxAYbGxwdGUz5MziiL5jek2kBma',
    amm: 'OKX',
    route: 'OKX > RaydiumV4',
    slot: 323178417,
    timestamp: 1740558320,
    signature: '3rEob1PiezEtzhjPJcDJ9menwWeUBmF19FfYysHP5v6DRQe6PVrWcLRBvAGDbB9Ubn8PF8FVKjQYVxDjA2wAwSgn',
    idx: '4-1'
  },
  {
    type: 'SELL',
    inputToken: {
      mint: 'suprkbfvwpFZXzWaoKjTzGkW1nkvvwK9n2E6g1zyLFo',
      amount: 4426.534814,
      decimals: 6
    },
    outputToken: {
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', //USDC
      amount: 40.776731,
      decimals: 6
    },
    user: 'DDRshAs8c2qQT3WK8RfRFsVUKEynHFgh2NLuJpxRFMAB',
    programId: '6m2CDdhRgxpH4WjvdzxAYbGxwdGUz5MziiL5jek2kBma',
    amm: 'OKX',
    route: 'OKX > Meteora DLMM',
    slot: 323178600,
    timestamp: 1740558393,
    signature: '33VnDBtrFawBRYwDqomdsH57GL83B7eWTQN5mnga9F1whyMzcpdmURnPkAjqDte8Ja9EcsGcejhDYcUKkA9sE4HG',
    idx: '4-1',
  }
];

describe('Dex Parser', () => {
  let connection: Connection;
  beforeAll(async () => {
    // Initialize connection
    const rpcUrl = process.env.SOLANA_RPC_URL;
    if (!rpcUrl) {
      throw new Error('SOLANA_RPC_URL environment variable is not set');
    }
    connection = new Connection(rpcUrl, { commitment: 'confirmed', httpAgent: new https.Agent({ host: '127.0.0.1', port: 7890 }) });
  });

  describe('Parse Trades', () => {
    const parser = new DexParser(connection);
    const expectItem = (item: any, test: any) => {
      expect(item.type).toEqual(test.type);
      expect(item.user).toEqual(test.user);
      expect(item.inputToken.mint).toEqual(test.inputToken.mint);
      expect(item.inputToken.amount).toEqual(test.inputToken.amount);
      expect(item.inputToken.decimals).toEqual(test.inputToken.decimals);
      expect(item.outputToken.mint).toEqual(test.outputToken.mint);
      expect(item.outputToken.amount).toEqual(test.outputToken.amount);
      expect(item.outputToken.decimals).toEqual(test.outputToken.decimals);
      expect(item.amm).toEqual(test.amm);
      expect(item.programId).toEqual(test.programId);
      expect(item.slot).toEqual(test.slot);
      expect(item.timestamp).toEqual(test.timestamp);
      expect(item.signature).toEqual(test.signature);
    }

    Object.values(tests)
      .flat()
      // .filter((test: any) => test.test == true) // test only
      .forEach((test) => {
        it(`${test.type} > ${test.amm} > ${test.signature} `, async () => {
          const tx = await connection.getParsedTransaction(test.signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0,
          });
          if (!tx) { throw new Error(`Transaction not found > ${test.signature}`); }

          const trades = parser.parseTrades(tx);
          // console.log('trades', trades);
          expect(trades.length).toBeGreaterThanOrEqual(1);
          expectItem(trades[0], test);
          if (test.items) {
            expect(trades.length).toBeGreaterThan(1);
            expectItem(trades[1], test.items[0]);
          }
        });
      });
  });
});
