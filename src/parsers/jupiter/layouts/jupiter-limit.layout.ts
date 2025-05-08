import base58 from 'bs58';

export class JupiterLimitOrderV2TradeLayout {
  orderKey: Uint8Array;
  taker: Uint8Array;
  remainingMakingAmount: bigint;
  remainingTakingAmount: bigint;
  makingAmount: bigint;
  takingAmount: bigint;

  constructor(fields: {
    orderKey: Uint8Array;
    taker: Uint8Array;
    remainingMakingAmount: bigint;
    remainingTakingAmount: bigint;
    makingAmount: bigint;
    takingAmount: bigint;
  }) {
    this.orderKey = fields.orderKey;
    this.taker = fields.taker;
    this.remainingMakingAmount = fields.remainingMakingAmount;
    this.remainingTakingAmount = fields.remainingTakingAmount;
    this.makingAmount = fields.makingAmount;
    this.takingAmount = fields.takingAmount;
  }

  static schema = new Map([
    [
      JupiterLimitOrderV2TradeLayout,
      {
        kind: 'struct',
        fields: [
          ['orderKey', [32]],
          ['taker', [32]],
          ['remainingMakingAmount', 'u64'],
          ['remainingTakingAmount', 'u64'],
          ['makingAmount', 'u64'],
          ['takingAmount', 'u64'],
        ],
      },
    ],
  ]);

  toObject() {
    return {
      orderKey: base58.encode(this.orderKey),
      taker: base58.encode(this.taker),
      remainingMakingAmount: this.remainingMakingAmount,
      remainingTakingAmount: this.remainingTakingAmount,
      makingAmount: this.makingAmount,
      takingAmount: this.takingAmount,
    };
  }
}
