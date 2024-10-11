const dotenv = require('dotenv');
require("@nomicfoundation/hardhat-toolbox");
require('hardhat-deploy')
require('@layerzerolabs/toolbox-hardhat')

dotenv.config();

const {
  PRIVATE_KEY,
  MAINNET_NETWORK_URL,
  SEPOLIA_NETWORK_URL
} = process.env;

module.exports = {
  networks: {
    ethMain: {
      url: MAINNET_NETWORK_URL,
      ...(PRIVATE_KEY ? { accounts: [PRIVATE_KEY] } : {}),
    },
    ethSepolia: {
      url: SEPOLIA_NETWORK_URL,
      ...(PRIVATE_KEY ? { accounts: [PRIVATE_KEY] } : {}),
    },
  },
  solidity: {
    version:  "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      }
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
};
