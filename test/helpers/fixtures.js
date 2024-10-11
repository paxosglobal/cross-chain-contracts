const { ethers } = require("hardhat");

const PAXOS_TOKEN_FIXTURE = "PaxosTokenFixture"
const LZ_ENDPOINT_FIXTURE = "LzEndpointFixture"
const OFT_WRAPPER = "OFTWrapperFixture"

async function deployOFTWrapper() {
    const [owner, admin, recipient, assetProtectionRole, acc, acc2, acc3] = await ethers.getSigners();
    const lzEndpoint = await ethers.deployContract(LZ_ENDPOINT_FIXTURE, [1, acc2.address])
    const tokenFixture = await ethers.deployContract(PAXOS_TOKEN_FIXTURE)
    const contract = await ethers.deployContract(OFT_WRAPPER, [tokenFixture.address, lzEndpoint.address, acc2.address])
    return { owner, admin, recipient, acc, acc2, acc3, assetProtectionRole, contract, tokenFixture }

}

module.exports = {
  deployOFTWrapper
}
