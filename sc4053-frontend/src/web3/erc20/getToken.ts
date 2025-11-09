import Web3 from "web3";
import erc20ABI from "./erc20.abi.json";

type TokenDetails = {
  name: string;
  symbol: string;
  decimals: number;
};

export async function getToken(
  web3Url: string,
  address: string
): Promise<TokenDetails> {
  const web3 = new Web3(web3Url);
  const contract = new web3.eth.Contract(erc20ABI, address);

  const [name, symbol, decimals] = await Promise.all([
    contract.methods.name().call(),
    contract.methods.symbol().call(),
    contract.methods.decimals().call(),
  ]);

  const decimalNumber = parseInt(decimals as unknown as string, 10);

  return {
    name: name as unknown as string,
    symbol: symbol as unknown as string,
    decimals: decimalNumber,
  };
}
