import Web3 from "web3";
import erc20ABI from "./erc20.abi.json";

export function encodeApprove(
  web3Url: string,
  tokenAddress: string,
  spenderAddress: string,
  amount: bigint
): string {
  const web3 = new Web3(web3Url);
  const contract = new web3.eth.Contract(erc20ABI, tokenAddress);
  const data = contract.methods
    .approve(spenderAddress, amount.toString())
    .encodeABI();
  return data;
}
