require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config(); // Import dotenv to load environment variables
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: process.env.ALCHEMY_SEPOLIA_URL || `https://sepolia.infura.io/v3/${process.env.VITE_INFURA_PROJECT_ID}`,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    // Add other networks as needed (e.g., mainnet, polygon, etc.)
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY, // Optional: for contract verification
  },
};
