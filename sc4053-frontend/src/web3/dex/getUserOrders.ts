import { web3 } from "../web3";
import dexABI from "./dex.abi.json";

type Order = {
  userAddress: string;
  orderType: number;
  orderID: string;
  price: bigint;
  quantity: bigint;
  tokenPair0: string;
  tokenPair1: string;
};

export async function getUserOrders(
  DEXAddress: string,
  address: string
): Promise<Order[]> {
  const contract = new web3.eth.Contract(dexABI, DEXAddress);

  const orders = (await contract.methods
    .getUserOrders(address)
    .call()) as unknown as {
    userAddress: string;
    orderType: string;
    orderID: string;
    price: string;
    quantity: string;
    tokenPair0: string;
    tokenPair1: string;
  }[];

  return orders.map((order) => {
    return {
      userAddress: order.userAddress,
      orderType: parseInt(order.orderType),
      orderID: order.orderID.toString(),
      price: BigInt(order.price),
      quantity: BigInt(order.quantity),
      tokenPair0: order.tokenPair0,
      tokenPair1: order.tokenPair1,
    } as Order;
  });
}
