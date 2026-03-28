const { ethers, upgrades } = require("hardhat");
const { PrintDeployerDetails } = require('./utils');
const { ValidateEnvironmentVariables, ReadConfig, WriteConfig } = require('./utils/helpers');

const { CONFIG_PATH_EVM } = process.env;

const OFT_WRAPPER_CONTRACT_NAME = "OFTWrapperUpgradeable";

const config = ReadConfig(CONFIG_PATH_EVM)

async function getImplementationAddressWithRetry(proxyAddress, maxRetries = 5, initialDelayMs = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await upgrades.erc1967.getImplementationAddress(proxyAddress);
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error(
          `Failed to read implementation address after ${maxRetries} attempts. ` +
          `Proxy was deployed at ${proxyAddress}. Error: ${error.message}`
        );
      }
      const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
      console.log(`Attempt ${attempt}/${maxRetries} failed to read implementation address. Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

async function main() {
  ValidateEnvironmentVariables([CONFIG_PATH_EVM])
  PrintDeployerDetails();

  // Get token decimals from the token contract
  const tokenContract = new ethers.Contract(
    config.TOKEN_ADDRESS,
    ["function decimals() view returns (uint8)"],
    ethers.provider
  );
  const tokenDecimals = await tokenContract.decimals();

  console.log("\nDeploying OFTWrapperUpgradeable via UUPS proxy...")

  const OFTWrapper = await ethers.getContractFactory(OFT_WRAPPER_CONTRACT_NAME);

  // Deploy using UUPS proxy pattern
  const proxy = await upgrades.deployProxy(
    OFTWrapper,
    [
      config.DELEGATE_ADDRESS, // delegate
      config.DELEGATE_ADDRESS  // owner
    ],
    {
      initializer: 'initialize',
      kind: 'uups',
      constructorArgs: [tokenDecimals, config.EVM_ENDPOINT_CONTRACT_ADDRESS, config.TOKEN_ADDRESS],
      // constructor & state-variable-immutable: Safe for UUPS - immutables are stored in bytecode, not proxy storage
      // missing-initializer-call & missing-initializer: LayerZero's __OFTCore_init internally calls all parent initializers
      unsafeAllow: ['constructor', 'state-variable-immutable', 'missing-initializer-call', 'missing-initializer']
    }
  );

  await proxy.deployed();

  console.log("\n=== Deployment Complete ===");
  console.log("Proxy Address:", proxy.address);

  // Get implementation address (retry with backoff for chains with eventual consistency)
  const implementationAddress = await getImplementationAddressWithRetry(proxy.address);
  console.log("Implementation Address:", implementationAddress);

  // Save OFTWrapper proxy address to config files
  config['EVM_OFT_ADDRESS'] = proxy.address;
  config['EVM_OFT_IMPLEMENTATION_ADDRESS'] = implementationAddress;
  WriteConfig(CONFIG_PATH_EVM, config);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
});
