const {expect} = require('chai');
const {ContractFactory} = require('ethers');
const {deployments, ethers} = require('hardhat');

const {Options} = require('@layerzerolabs/lz-v2-utilities');

describe('OFTWrapper Send Test', function () {
  // Constant representing a mock Endpoint ID for testing purposes
  const eidA = 1;
  const eidB = 2;
  // Declaration of variables to be used in the test suite
  let MyOFT;
  let EndpointV2Mock;
  let ownerA;
  let ownerB;
  let endpointOwner;
  let myOFTA;
  let myOFTB;
  let mockEndpointA;
  let mockEndpointB;
  let tokenFixture;
  let tokenFixtureB;

  // Before hook for setup that runs once before all tests in the block
  before(async function () {
    tokenFixture = await ethers.deployContract("PaxosTokenFixture")
    tokenFixtureB = await ethers.deployContract("PaxosTokenFixture")
    // Contract factory for our tested contract
    MyOFT = await ethers.getContractFactory('OFTWrapper');

    // Fetching the first three signers (accounts) from Hardhat's local Ethereum network
    const signers = await ethers.getSigners();

    ownerA = signers.at(0);
    ownerB = signers.at(1);
    endpointOwner = signers.at(2);

    // The EndpointV2Mock contract comes from @layerzerolabs/test-devtools-evm-hardhat package
    // and its artifacts are connected as external artifacts to this project
    //
    // Unfortunately, hardhat itself does not yet provide a way of connecting external artifacts
    // so we rely on hardhat-deploy to create a ContractFactory for EndpointV2Mock
    //
    // See https://github.com/NomicFoundation/hardhat/issues/1040
    const EndpointV2MockArtifact = await deployments.getArtifact('EndpointV2Mock');
    EndpointV2Mock = new ContractFactory(
      EndpointV2MockArtifact.abi,
      EndpointV2MockArtifact.bytecode,
      endpointOwner,
    );
  });

  // beforeEach hook for setup that runs before each test in the block
  beforeEach(async function () {
    // Deploying a mock LZEndpoint with the given Endpoint ID
    mockEndpointA = await EndpointV2Mock.deploy(eidA);
    mockEndpointB = await EndpointV2Mock.deploy(eidB);
    // Deploying two instances of MyOFT contract and linking them to the mock LZEndpoint
    myOFTA = await MyOFT.connect(ownerA).deploy(tokenFixture.address, mockEndpointA.address, ownerA.address)
    myOFTB = await MyOFT.connect(ownerB).deploy(tokenFixtureB.address, mockEndpointB.address, ownerB.address)

    // Setting destination endpoints in the LZEndpoint mock for each MyOFT instance
    await mockEndpointA.setDestLzEndpoint(myOFTB.address, mockEndpointB.address);
    await mockEndpointB.setDestLzEndpoint(myOFTA.address, mockEndpointA.address);

    // Setting each MyOFT instance as a peer of the other in the mock LZEndpoint
    await myOFTA.connect(ownerA).setPeer(eidB, ethers.utils.zeroPad(myOFTB.address, 32));
    await myOFTB.connect(ownerB).setPeer(eidA, ethers.utils.zeroPad(myOFTA.address, 32));
  });

  // A test case to verify token transfer functionality
  it('should send a token from A address to B address via each OFT', async function () {
    // Minting an initial amount of tokens to ownerA's address in the myOFTA contract
    const initialAmount = ethers.utils.parseEther('100');
    await tokenFixture.increaseSupplyToAddress(initialAmount, ownerA.address);

    // Defining the amount of tokens to send and constructing the parameters for the send operation
    const tokensToSend = ethers.utils.parseEther('1');
    // Defining extra message execution options for the send operation
    const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString()
    const sendParam = [
      eidB,
      ethers.utils.zeroPad(ownerB.address, 32),
      tokensToSend,
      tokensToSend,
      options,
      '0x',
      '0x',
    ]

    // Fetching the native fee for the token send operation
    const [nativeFee] = await myOFTA.quoteSend(sendParam, false);

    // Executing the send operation from myOFTA contract
    await myOFTA.send(sendParam, [nativeFee, 0], ownerA.address, { value: nativeFee });

    // Fetching the final token balances of ownerA and ownerB
    const finalBalanceA = await tokenFixture.balanceOf(ownerA.address);
    const finalBalanceB = await tokenFixtureB.balanceOf(ownerB.address);

    // Asserting that the final balances are as expected after the send operation
    expect(finalBalanceA.eq(initialAmount.sub(tokensToSend))).to.be.true;
    expect(finalBalanceB.eq(tokensToSend)).to.be.true;
  });
});