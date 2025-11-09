import Web3 from "web3";
import dexABI from "./dex.abi.json";

export function encodeCancelOrder(
  web3Url: string,
  DEXAddress: string,
  orderID: number
): string {
  const web3 = new Web3(web3Url);
  const contract = new web3.eth.Contract(dexABI, DEXAddress);
  const encodedData = contract.methods.cancelOrder(orderID).encodeABI();

  return encodedData;
}
