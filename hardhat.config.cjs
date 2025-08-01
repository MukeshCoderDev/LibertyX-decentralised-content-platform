require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config(); // Import dotenv to load environment variables

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: process.env.INFURA_SEPOLIA_URL || "https://sepolia.infura.io/v3/7cddccd83fda404b941fe80581c76c0a",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: 20000000000, // 20 gwei
      gas: 6000000,
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL,
      accounts: process.env.MAINNET_PRIVATE_KEY ? [process.env.MAINNET_PRIVATE_KEY] : [],
      chainId: 1,
      gasPrice: 20000000000, // 20 gwei - adjust based on network conditions
      gas: 6000000,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY, // Optional: for contract verification
  },
};
