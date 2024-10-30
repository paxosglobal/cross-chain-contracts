const { ethers } = require("hardhat");
const { PrintDeployerDetails, PrintContractDetails } = require('./utils');
const { ValidateEnvironmentVariables } = require('./utils/helpers');

const { DELEGATE_ADDRESS, DESTINATION_EID, LIMIT, WINDOW } = process.env;

const OFT_WRAPPER_CONTRACT_NAME = "OFTWrapper";
const PAXOS_TOKEN_FIXTURE = "PaxosTokenFixture"
const LZ_ENDPOINT_FIXTURE = "LzEndpointFixture"

const rateLimitConfig = {
  dstEid: DESTINATION_EID,
  limit: LIMIT,
  window: WINDOW
}

//Only used for local testing or sepolia.
async function main() {
  ValidateEnvironmentVariables([DELEGATE_ADDRESS, DESTINATION_EID, LIMIT, WINDOW])
  PrintDeployerDetails();
  const tokenContractFactoryImplementation = await ethers.getContractFactory(PAXOS_TOKEN_FIXTURE);
  let tokenContractImplementation = await tokenContractFactoryImplementation.deploy();
  PrintContractDetails(tokenContractImplementation, PAXOS_TOKEN_FIXTURE);

  const endpointContractFactoryImplementation = await ethers.getContractFactory(LZ_ENDPOINT_FIXTURE);
  let endpointContractImplementation = await endpointContractFactoryImplementation.deploy(1, DELEGATE_ADDRESS);
  PrintContractDetails(endpointContractImplementation, LZ_ENDPOINT_FIXTURE);

  console.log("\nDeploying Implementation contract...")
  const contractFactoryImplementation = await ethers.getContractFactory(OFT_WRAPPER_CONTRACT_NAME);
  let contractImplementation = await contractFactoryImplementation.deploy(tokenContractImplementation.address, endpointContractImplementation.address, DELEGATE_ADDRESS, [rateLimitConfig]);
  PrintContractDetails(contractImplementation, OFT_WRAPPER_CONTRACT_NAME);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
});
