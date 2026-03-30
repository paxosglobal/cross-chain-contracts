const { ethers, upgrades } = require("hardhat");

const PAXOS_TOKEN_FIXTURE = "PaxosTokenFixture"
const LZ_ENDPOINT_FIXTURE = "LzEndpointFixture"
const OFT_WRAPPER_FIXTURE = "OFTWrapperUpgradeableFixture"
const LIMIT = ethers.utils.parseEther('1000')
const INBOUND_LIMIT = ethers.utils.parseEther('500')

async function deployOFTWrapperUpgradeable() {
    const [owner, admin, recipient, assetProtectionRole, acc, acc2, acc3] = await ethers.getSigners();

    const lzEndpoint = await ethers.deployContract(LZ_ENDPOINT_FIXTURE, [1, acc2.address])
    const tokenFixture = await ethers.deployContract(PAXOS_TOKEN_FIXTURE)

    // Get token decimals for the constructor
    const tokenDecimals = await tokenFixture.decimals()

    // Deploy using UUPS proxy pattern
    const OFTWrapperUpgradeableFixture = await ethers.getContractFactory(OFT_WRAPPER_FIXTURE);
    const contract = await upgrades.deployProxy(
        OFTWrapperUpgradeableFixture,
        [
            acc2.address,          // _delegate
            owner.address          // _owner
        ],
        {
            initializer: 'initialize',
            kind: 'uups',
            constructorArgs: [tokenDecimals, lzEndpoint.address, tokenFixture.address],
            unsafeAllow: ['constructor', 'state-variable-immutable', 'missing-initializer-call', 'missing-initializer']
        }
    );
    await contract.deployed();

    // Set up rate limits after deployment
    const outboundRateLimitConfig = {
       dstEid: 1,
       limit: LIMIT,
       window: 100
    }
    const inboundRateLimitConfig = {
       dstEid: 1,
       limit: INBOUND_LIMIT,
       window: 100
    }
    await contract.setOutboundRateLimits([outboundRateLimitConfig]);
    await contract.setInboundRateLimits([inboundRateLimitConfig]);

    return { owner, admin, recipient, acc, acc2, acc3, assetProtectionRole, contract, tokenFixture, lzEndpoint }
}

module.exports = {
  deployOFTWrapperUpgradeable,
  LIMIT,
  INBOUND_LIMIT,
}
