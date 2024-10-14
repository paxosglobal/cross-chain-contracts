const { ethers } = require("hardhat");
const { PrintDeployerDetails } = require('./utils');
const { abi: oftAbi }= require("../artifacts/contracts/OFTWrapper.sol/OFTWrapper.json")
const bs58 = require('bs58')
const { ValidateEnvironmentVariables } = require('./utils/helpers');

const { ETH_OFT_ADDRESS, RECIPIENT_ADDRESS, DESTINATION_EID, REFUND_ADDRESS } = process.env;

//Tests sending a cross chain transfer
async function main() {
  ValidateEnvironmentVariables([ETH_OFT_ADDRESS, RECIPIENT_ADDRESS, DESTINATION_EID, REFUND_ADDRESS])
  PrintDeployerDetails();

  const AMOUNT = 10000

  console.log("\nGet quoted amount...")
  const signer = await ethers.provider.getSigner()
  const oftContract = new ethers.Contract(ETH_OFT_ADDRESS, oftAbi, signer);
  const peerAddressBytes = bs58.decode(RECIPIENT_ADDRESS)
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
  const value = quotedAmount.nativeFee

  console.log(value)
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
