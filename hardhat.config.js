const dotenv = require('dotenv');
require("@nomicfoundation/hardhat-toolbox");
require('hardhat-deploy')
require('@layerzerolabs/toolbox-hardhat')

dotenv.config();

const {
  PRIVATE_KEY,
  URL_ETH_MAINNET,
  URL_ETH_SEPOLIA
} = process.env;

module.exports = {
  networks: {
    ethMain: {
      url: URL_ETH_MAINNET,
      ...(PRIVATE_KEY ? { accounts: [PRIVATE_KEY] } : {}),
    },
    ethSepolia: {
      url: URL_ETH_SEPOLIA,
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
