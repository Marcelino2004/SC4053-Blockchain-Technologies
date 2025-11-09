import Web3 from "web3";
import dexABI from "./dex.abi.json";

export enum OrderType {
  MARKET = 0,
  LIMIT = 1,
  STOP = 2,
}

export interface InputOrder {
  orderType: OrderType;
  price: bigint;
  quantity: bigint;
  tokenPair0: string;
  tokenPair1: string;
}

export function encodeAddOrder(
  web3Url: string,
  DEXAddress: string,
  inputOrder: InputOrder
): string {
  const { orderType, price, quantity, tokenPair0, tokenPair1 } = inputOrder;

  const web3 = new Web3(web3Url);
  const contract = new web3.eth.Contract(dexABI, DEXAddress);

  // Convert price and quantity to the correct format with 1e18 scaling

  // Create the input order object matching the Solidity struct
  const formattedOrder = {
    orderType: orderType.toString(),
    price: price.toString(),
    quantity: quantity.toString(),
    tokenPair0,
    tokenPair1,
  };

  // Encode the function call
  const encodedData = contract.methods.addOrder(formattedOrder).encodeABI();

  return encodedData;
}
