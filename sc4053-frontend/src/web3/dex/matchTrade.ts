import Web3 from "web3";
import dexABI from "./dex.abi.json";

export async function matchTrade(
  web3Url: string,
  DEXAddress: string,
  orderIDs: number[],       // array of order IDs
  quantities: bigint[],     // array of quantities in wei
  fromAddress: string       // the user executing the tx
) {
  const web3 = new Web3(web3Url);
  const dexContract = new web3.eth.Contract(dexABI, DEXAddress);

  try {
    const tx = await dexContract.methods
      .matchTrade(orderIDs, quantities)
      .send({ from: fromAddress });

    return tx;
  } catch (err) {
    console.error("matchTrade failed:", err);
    throw err;
  }
}
