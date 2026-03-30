const dotenv = require('dotenv');
require("@nomicfoundation/hardhat-toolbox");
require('hardhat-deploy')
require('@layerzerolabs/toolbox-hardhat')
require('@openzeppelin/hardhat-upgrades')

dotenv.config();

const {
  PRIVATE_KEY,
  URL_ETH_MAINNET,
  URL_ETH_SEPOLIA,
  URL_INK_MAINNET,
  URL_INK_SEPOLIA,
  URL_ARB_MAINNET,
  URL_ARB_SEPOLIA,
  URL_XLAYER_TESTNET,
  URL_XLAYER_MAINNET,
  EXPLORER_ARB_API_KEY_MAINNET,
} = process.env;

const accounts = PRIVATE_KEY ? [PRIVATE_KEY] : [];

const networks = {
  hardhat: {
    // EndpointV2Mock from @layerzerolabs/test-devtools-evm-hardhat is 25KB, exceeding the 24KB limit
    allowUnlimitedContractSize: true,
  },
};

if (URL_ETH_MAINNET) networks.ethMain = { url: URL_ETH_MAINNET, accounts };
if (URL_ETH_SEPOLIA) networks.ethSepolia = { url: URL_ETH_SEPOLIA, accounts };
if (URL_INK_MAINNET) networks.inkMain = { url: URL_INK_MAINNET, accounts };
if (URL_INK_SEPOLIA) networks.inkSepolia = { url: URL_INK_SEPOLIA, accounts };
if (URL_ARB_MAINNET) networks.arbMain = { url: URL_ARB_MAINNET, accounts };
if (URL_ARB_SEPOLIA) networks.arbSepolia = { url: URL_ARB_SEPOLIA, accounts };
if (URL_XLAYER_TESTNET) networks.xlayerTestnet = { url: URL_XLAYER_TESTNET, accounts };
if (URL_XLAYER_MAINNET) networks.xlayerMainnet = { url: URL_XLAYER_MAINNET, accounts };

module.exports = {
  networks,
  solidity: {
    version:  "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      }
    },
  },
  etherscan: {
    apiKey: EXPLORER_ARB_API_KEY_MAINNET, // Etherscan V2 unified API key
    customChains: [
      {
        network: "inkMain",
        chainId: 57073,
        urls: {
          apiURL: "https://explorer.inkonchain.com/api",
          browserURL: "https://explorer.inkonchain.com/"
        }
      },
      {
        network: "inkSepolia",
        chainId: 763373,
        urls: {
          apiURL: "https://explorer-sepolia.inkonchain.com/api",
          browserURL: "https://explorer-sepolia.inkonchain.com/"
        }
      },
      {
        network: "arbMain",
        chainId: 42161,
        urls: {
          apiURL: "https://api.arbiscan.io/api",
          browserURL: "https://arbiscan.io/"
        }
      },
      {
        network: "arbSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=421614",
          browserURL: "https://sepolia.arbiscan.io/"
        }
      },
      {
        network: "xlayerTestnet",
        chainId: 1952,
        urls: {
            apiURL: "https://www.oklink.com/api/v5/explorer/contract/verify-source-code-plugin/XLAYER_TESTNET",
            browserURL: "https://www.oklink.com/xlayer-test"
        }
      },
      {
        network: "xlayerMainnet",
        chainId: 196,
        urls: {
            apiURL: "https://www.oklink.com/api/v5/explorer/contract/verify-source-code-plugin/XLAYER",
            browserURL: "https://www.oklink.com/xlayer"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
};
