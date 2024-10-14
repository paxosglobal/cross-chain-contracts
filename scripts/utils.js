const { ethers } = require("hardhat");

async function PrintDeployerDetails() {
  const [deployer] = await ethers.getSigners();
  console.log('Deployer: %s', deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Account balance: %s', ethers.utils.formatEther(balance));
}

async function PrintContractDetails(contract, contractName) {
  console.log("%s contract deployed at: %s", contractName, contract.address);
  console.log("%s contract deploy tx: %s", contractName, contract.deployTransaction.hash)
}

module.exports = {
  PrintDeployerDetails,
  PrintContractDetails,
}