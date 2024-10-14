const { ethers } = require("hardhat");
const { PrintDeployerDetails, PrintContractDetails } = require('./utils');
const { ValidateEnvironmentVariables } = require('./utils/helpers');

const { TOKEN_ADDRESS, ETH_ENDPOINT_CONTRACT_ADDRESS, DELEGATE_ADDRESS } = process.env;

const OFT_WRAPPER_CONTRACT_NAME = "OFTWrapper";

const initializerArgs = [
  TOKEN_ADDRESS,
  ETH_ENDPOINT_CONTRACT_ADDRESS,
  DELEGATE_ADDRESS,
]

async function main() {
  ValidateEnvironmentVariables(initializerArgs)
  PrintDeployerDetails();

  console.log("\nDeploying Implementation contract...")
  const contractFactoryImplementation = await ethers.getContractFactory(OFT_WRAPPER_CONTRACT_NAME);
  let contractImplementation = await contractFactoryImplementation.deploy(...initializerArgs);
  PrintContractDetails(contractImplementation, OFT_WRAPPER_CONTRACT_NAME);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
});
