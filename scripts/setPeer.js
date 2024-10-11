const { ethers } = require("hardhat");
const { PrintDeployerDetails } = require('./utils');
const { abi: oftAbi }= require("../artifacts/contracts/OFTWrapper.sol/OFTWrapper.json")
const bs58 = require('bs58')
const { ValidateEnvironmentVariables } = require('./utils/helpers');

const { ETH_OFT_ADDRESS, PEER_ADDRESS, DESTINATION_EID, DESTINATION_NETWORK } = process.env;
const ETHEREUM = "ETHEREUM"
const SOLANA = "SOLANA"

async function main() {
  ValidateEnvironmentVariables([ETH_OFT_ADDRESS, PEER_ADDRESS, DESTINATION_EID, DESTINATION_NETWORK])
  PrintDeployerDetails();

  console.log("\nSetting peer...")
  let peerAddressBytes;
  if (DESTINATION_NETWORK == ETHEREUM) {
    peerAddressBytes = PEER_ADDRESS; //EVM - PEER_ADDRESS should be 0 padded to 32 bytes.  E.g. 0x000000000000000000000000<evm_address>
  } else if (DESTINATION_NETWORK == SOLANA) {
    peerAddressBytes = bs58.decode(PEER_ADDRESS) //Solana - PEER_ADDRESS should not be padded
  } else {
    console.log('DESTINATION_NETWORK not recognized')
    return;
  }
  const signer = await ethers.provider.getSigner()
  const oftContract = new ethers.Contract(ETH_OFT_ADDRESS, oftAbi, signer);
  const transaction = await oftContract.setPeer(DESTINATION_EID, peerAddressBytes)
  await transaction.wait();

  console.log("\nSet peer to " + PEER_ADDRESS);

  const isPeer= await oftContract.isPeer(DESTINATION_EID, peerAddressBytes)
  console.log(PEER_ADDRESS + " is peer? " + isPeer);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
});
