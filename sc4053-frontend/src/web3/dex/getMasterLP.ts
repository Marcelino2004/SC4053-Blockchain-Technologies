import Web3 from "web3";
import dexABI from "./dex.abi.json";

export async function getMasterLP(
  web3Url: string,
  DEXAddress: string
): Promise<string> {
  const web3 = new Web3(web3Url);
  const contract = new web3.eth.Contract(dexABI, DEXAddress);

  const res = (await contract.methods.MasterLP().call()) as unknown;

  return res as string;
}
