import { DISCRIMINATORS } from '../../constants';
import { PoolEvent, PoolEventType, TransferData, convertToUiAmount } from '../../types';
import { MeteoraLiquidityParserBase } from './parser-meteora-liquidity-base';

export class MeteoraPoolsParser extends MeteoraLiquidityParserBase {
  public getPoolAction(data: Buffer): PoolEventType | null {
    const instructionType = data.slice(0, 8);
    if (instructionType.equals(DISCRIMINATORS.METEORA_POOLS.CREATE)) return 'CREATE';
    if (instructionType.equals(DISCRIMINATORS.METEORA_POOLS.ADD_LIQUIDITY)) return 'ADD';
    if (instructionType.equals(DISCRIMINATORS.METEORA_POOLS.REMOVE_LIQUIDITY)) return 'REMOVE';
    return null;
  }

  protected parseCreateLiquidityEvent(
    instruction: any,
    index: number,
    data: Buffer,
    transfers: TransferData[]
  ): PoolEvent {
    const accounts = this.adapter.getInstructionAccounts(instruction);
    const [token0, token1] = this.utils.getLPTransfers(transfers);
    const lpToken = transfers.find((t) => t.type === 'mintTo');
    const token0Mint = token0?.info.mint || accounts[3];
    const token1Mint = token1?.info.mint || accounts[4];
    const programId = this.adapter.getInstructionProgramId(instruction);
    const [token0Decimals, token1Decimals] = [
      this.adapter.getTokenDecimals(token0Mint),
      this.adapter.getTokenDecimals(token1Mint),
    ];

    return {
      ...this.adapter.getPoolEventBase('CREATE', programId),
      idx: index.toString(),
      poolId: accounts[0],
      poolLpMint: accounts[2],
      token0Mint,
      token1Mint,
      token0Amount: token0?.info.tokenAmount.uiAmount || convertToUiAmount(data.readBigUInt64LE(16), token0Decimals),
      token1Amount: token1?.info.tokenAmount.uiAmount || convertToUiAmount(data.readBigUInt64LE(8), token1Decimals),
      token0Decimals,
      token1Decimals,
      lpAmount: lpToken?.info.tokenAmount.uiAmount || 0,
    };
  }

  protected parseAddLiquidityEvent(
    instruction: any,
    index: number,
    data: Buffer,
    transfers: TransferData[]
  ): PoolEvent {
    const accounts = this.adapter.getInstructionAccounts(instruction);
    const [token0, token1] = this.utils.getLPTransfers(transfers);
    const lpToken = transfers.find((t) => t.type === 'mintTo');
    const token0Mint = token0?.info.mint;
    const token1Mint = token1?.info.mint;
    const programId = this.adapter.getInstructionProgramId(instruction);
    const [token0Decimals, token1Decimals] = [
      this.adapter.getTokenDecimals(token0Mint),
      this.adapter.getTokenDecimals(token1Mint),
    ];

    return {
      ...this.adapter.getPoolEventBase('ADD', programId),
      idx: index.toString(),
      poolId: accounts[0],
      poolLpMint: accounts[1],
      token0Mint,
      token1Mint,
      token0Amount: token0?.info.tokenAmount.uiAmount || convertToUiAmount(data.readBigUInt64LE(24), token0Decimals),
      token1Amount: token1?.info.tokenAmount.uiAmount || convertToUiAmount(data.readBigUInt64LE(16), token1Decimals),
      token0Decimals,
      token1Decimals,
      lpAmount:
        lpToken?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(8), this.adapter.getTokenDecimals(accounts[1])),
    };
  }

  protected parseRemoveLiquidityEvent(
    instruction: any,
    index: number,
    data: Buffer,
    transfers: TransferData[]
  ): PoolEvent {
    const accounts = this.adapter.getInstructionAccounts(instruction);
    const [token0, token1] = this.utils.getLPTransfers(transfers);
    const lpToken = transfers.find((t) => t.type === 'burn');
    const token0Mint = token0?.info.mint;
    const token1Mint = token1?.info.mint;
    const programId = this.adapter.getInstructionProgramId(instruction);
    const [token0Decimals, token1Decimals] = [
      this.adapter.getTokenDecimals(token0Mint),
      this.adapter.getTokenDecimals(token1Mint),
    ];

    return {
      ...this.adapter.getPoolEventBase('REMOVE', programId),
      idx: index.toString(),
      poolId: accounts[0],
      poolLpMint: accounts[1],
      token0Mint,
      token1Mint,
      token0Amount: token0?.info.tokenAmount.uiAmount || convertToUiAmount(data.readBigUInt64LE(24), token0Decimals),
      token1Amount: token1?.info.tokenAmount.uiAmount || convertToUiAmount(data.readBigUInt64LE(16), token1Decimals),
      token0Decimals,
      token1Decimals,
      lpAmount:
        lpToken?.info.tokenAmount.uiAmount ||
        convertToUiAmount(data.readBigUInt64LE(8), this.adapter.getTokenDecimals(accounts[1])),
    };
  }
}
