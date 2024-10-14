const { ethers } = require("hardhat");
const { PrintDeployerDetails } = require('./utils');
const {Options} = require('@layerzerolabs/lz-v2-utilities');
const { abi: oftAbi }= require("../artifacts/contracts/OFTWrapper.sol/OFTWrapper.json")
const { ValidateEnvironmentVariables } = require('./utils/helpers');

const { ETH_OFT_ADDRESS, DESTINATION_EID, GAS_LIMIT, MSG_VALUE } = process.env;
const SEND_MSG_TYPE = 1; // a standard token transfer via send()
const SEND_AND_CALL_MSG_TYPE = 2; // a composed token transfer via send()
/*
Recommended values:  GAS_LIMIT | MSG_VALUE
               EVM:  300000    | 0
            Solana:  2500000   | 200000 
*/
const GAS_OPTION = Options.newOptions().addExecutorLzReceiveOption(GAS_LIMIT, MSG_VALUE).toHex()

async function main() {
  ValidateEnvironmentVariables([ETH_OFT_ADDRESS, DESTINATION_EID, GAS_LIMIT, MSG_VALUE])
  PrintDeployerDetails();

  const signer = await ethers.provider.getSigner()
  const oftContract = new ethers.Contract(ETH_OFT_ADDRESS, oftAbi, signer);
  const enforced_options= [
    [
        DESTINATION_EID,
        SEND_MSG_TYPE,
        GAS_OPTION
    ],
    [
        DESTINATION_EID,
        SEND_AND_CALL_MSG_TYPE,
        GAS_OPTION
    ]

  ]
  const transaction = await oftContract.setEnforcedOptions(enforced_options)
  console.log("Called setEnforcedOptions")
  await transaction.wait();

  for (let option of enforced_options) {
    let enforcedOption = await oftContract.enforcedOptions(option[0], option[1]);
    console.log("Enforced option for endpoint ID " + option[0] + " and msgType " + option[1] + ": " + enforcedOption)
  }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
});
