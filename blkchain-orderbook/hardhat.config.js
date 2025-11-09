require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 31337, // Default chain ID for Hardhat local network
      // accounts: [
      //   {
      //     privateKey: "337f1630a96c5e45f022aa4d2829d5c118b88c64627477d11d1c6ab361fc11bb",
      //     balance: "10000000000000000000000", // Optional: funding the account with some Ether
      //   },
      // ],
    },
  },
};
