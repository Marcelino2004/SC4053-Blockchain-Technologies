import BigNumber from "bignumber.js";
import erc20ABI from "./erc20.abi.json";
import Web3 from "web3";

// Helper function to safely convert BigInt to string
function bigIntToString(value: bigint): string {
  return value.toString();
}

// Helper function to format balance with proper decimals using BigNumber
function formatBalance(balance: string, decimals: number): string {
  const bn = new BigNumber(balance);
  const divisor = new BigNumber(10).pow(decimals);
  return bn.dividedBy(divisor).toString();
}

export async function getTokenBalance(
  web3Url: string,
  account: string,
  token: string
) {
  try {
    // Create contract instance
    const web3 = new Web3(web3Url);
    const contract = new web3.eth.Contract(erc20ABI, token);

    // Get token decimals
    const decimals = await contract.methods.decimals().call();

    // Get raw balance (returns BigInt)
    const balance = await contract.methods.balanceOf(account).call();

    // Convert BigInt balance to string
    const balanceStr = bigIntToString(BigInt(balance as unknown as string));

    // Format balance with proper decimals using BigNumber
    const formattedBalance = formatBalance(
      balanceStr,
      decimals as unknown as number
    );

    return {
      success: true,
      rawBalance: balanceStr,
      formattedBalance: formattedBalance,
      decimals: parseInt(decimals as unknown as string),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
