import Web3, { ContractExecutionError } from "web3";
import dexABI from "./dex.abi.json";
import IMasterLiquidityPool from "./IMasterLiquidityPool.abi.json";
import ILiquidityPool from "./ILiquidityPool.abi.json";

type ErrorType =
  | "LPNotFound"
  | "LPNoLiquidity"
  | "LPAmountTooLow"
  | "UnknownError";

type GetPriceResponse = {
  success: boolean;
  error?: ErrorType;
  price?: bigint;
};

export async function getMarketPrice(
  web3Url: string,
  DEXAddress: string,
  tokenSell: string,
  tokenBuy: string,
  sellAmount: bigint
): Promise<GetPriceResponse> {
  const web3 = new Web3(web3Url);
  const dexContract = new web3.eth.Contract(dexABI, DEXAddress);

  const MasterLPContractAddr = (await dexContract.methods
    .MasterLP()
    .call()) as unknown;

  const MasterLPContract = new web3.eth.Contract(
    IMasterLiquidityPool,
    MasterLPContractAddr as string
  );

  try {
    const LPContractAddr = (await MasterLPContract.methods
      .getLP(tokenSell, tokenBuy)
      .call()) as unknown;

    const LPContract = new web3.eth.Contract(
      ILiquidityPool,
      LPContractAddr as string
    );

    const marketAmount = (await LPContract.methods
      .getAmountOut(sellAmount.toString(), tokenSell, tokenBuy)
      .call()) as unknown;

    return {
      price: BigInt(marketAmount as string),
      success: true,
    };
  } catch (e) {
    if (e instanceof ContractExecutionError) {
      if (
        e.cause.message.includes(
          "LP is not found for the particular token pair"
        )
      ) {
        return {
          success: false,
          error: "LPNotFound",
        };
      } else if (e.cause.message.includes(`No liquidity in pool`)) {
        return {
          success: false,
          error: "LPNoLiquidity",
        };
      } else if (e.cause.message.includes("Amount must be greater than 0")) {
        return {
          success: false,
          error: "LPAmountTooLow",
        };
      } else {
        console.error(e);
        return {
          success: false,
          error: "UnknownError",
        };
      }
    }
    console.log(e);
    return {
      success: false,
      error: "UnknownError",
    };
  }
}
