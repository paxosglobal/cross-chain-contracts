const { ethers } = require("hardhat");
const { PrintDeployerDetails } = require('./utils');
const { abi: oftAbi }= require("../artifacts/contracts/OFTWrapper.sol/OFTWrapper.json")
const bs58 = require('bs58')
const { ValidateEnvironmentVariables, getPeerAddressBytes } = require('./utils/helpers');

const { EVM_OFT_ADDRESS, RECIPIENT_ADDRESS, DESTINATION_EID, REFUND_ADDRESS, AMOUNT } = process.env;

//Tests sending a cross chain transfer
async function main() {
  ValidateEnvironmentVariables([EVM_OFT_ADDRESS, RECIPIENT_ADDRESS, DESTINATION_EID, REFUND_ADDRESS, AMOUNT])
  PrintDeployerDetails();

  console.log("\nGet quoted amount...")
  const signer = ethers.provider.getSigner()
  const oftContract = new ethers.Contract(EVM_OFT_ADDRESS, oftAbi, signer);
  const peerAddressBytes = getPeerAddressBytes(RECIPIENT_ADDRESS, DESTINATION_EID)
  const send_param = [
    DESTINATION_EID,
    peerAddressBytes,
    AMOUNT,
    AMOUNT,
    [],
    [],
    []
  ]
  const quotedAmount = await oftContract.quoteSend(send_param, false)
  console.log("quotedAmount: " + quotedAmount)

  const res = await oftContract.send(send_param, quotedAmount, REFUND_ADDRESS, {value: quotedAmount.nativeFee})
  console.log("Sent " + AMOUNT + " tokens!")
  console.log(res)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
});
