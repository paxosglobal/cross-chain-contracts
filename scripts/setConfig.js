const { ethers } = require("hardhat");
const { PrintDeployerDetails } = require('./utils');
const { ValidateEnvironmentVariables } = require('./utils/helpers');

const { ETH_OFT_ADDRESS, ETH_SEND_LIB_ADDRESS, ETH_RECEIVE_LIB_ADDRESS, ETH_ENDPOINT_CONTRACT_ADDRESS, 
  DESTINATION_EID, PAXOS_DVN_ADDRESS, LZ_DVN_ADDRESS, GOOGLE_DVN_ADDRESS, HORIZON_DVN_ADDRESS, NETHER_DVN_ADDRESS, 
  CONFIRMATIONS, MAX_MESSAGE_SIZE, EXECUTOR_ADDRESS, NETWORK,
  NETWORK_URL, PRIVATE_KEY } = process.env;

const MAINNET = "mainnet"
const remoteEid = DESTINATION_EID;

// Set up the provider and signer
const provider = new ethers.providers.JsonRpcProvider(NETWORK_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

// Set up the endpoint contract
const endpointAbi = [
  'function setSendLibrary(address oapp, uint32 eid, address sendLib) external',
  'function setReceiveLibrary(address oapp, uint32 eid, address receiveLib) external',
  'function setConfig(address oappAddress, address sendLibAddress, tuple(uint32 eid, uint32 configType, bytes config)[] setConfigParams) external',
];
const endpointContract = new ethers.Contract(ETH_ENDPOINT_CONTRACT_ADDRESS, endpointAbi, signer);

// Configuration
// Mainnet config
const ulnConfig = {
  confirmations: CONFIRMATIONS,
  requiredDVNCount: 3, 
  optionalDVNCount: 2, 
  optionalDVNThreshold: 1, 
  requiredDVNs: [PAXOS_DVN_ADDRESS, LZ_DVN_ADDRESS, GOOGLE_DVN_ADDRESS], 
  optionalDVNs: [HORIZON_DVN_ADDRESS, NETHER_DVN_ADDRESS], 
};

// Testnet config
const testUlnConfig = {
  confirmations: CONFIRMATIONS,
  requiredDVNCount: 1, 
  optionalDVNCount: 0, 
  optionalDVNThreshold: 0, 
  requiredDVNs: [LZ_DVN_ADDRESS], 
  optionalDVNs: [], 
};

const executorConfig = {
  maxMessageSize: MAX_MESSAGE_SIZE, 
  executorAddress: EXECUTOR_ADDRESS, 
};

// Encode UlnConfig using defaultAbiCoder
const configTypeUlnStruct =
  'tuple(uint64 confirmations, uint8 requiredDVNCount, uint8 optionalDVNCount, uint8 optionalDVNThreshold, address[] requiredDVNs, address[] optionalDVNs)';
const encodedUlnConfig = ethers.utils.defaultAbiCoder.encode([configTypeUlnStruct], [NETWORK == MAINNET ? ulnConfig : testUlnConfig]);

// Encode ExecutorConfig using defaultAbiCoder
const configTypeExecutorStruct = 'tuple(uint32 maxMessageSize, address executorAddress)';
const encodedExecutorConfig = ethers.utils.defaultAbiCoder.encode(
  [configTypeExecutorStruct],
  [executorConfig],
);

const EXECUTOR_CONFIG_TYPE = 1; // 1 for executor
const ULN_CONFIG_TYPE = 2; // 2 for UlnConfig

// Define the SetConfigParam structs
const setConfigParamUln = {
  eid: remoteEid,
  configType: ULN_CONFIG_TYPE,
  config: encodedUlnConfig,
};

const setConfigParamExecutor = {
  eid: remoteEid,
  configType: EXECUTOR_CONFIG_TYPE,
  config: encodedExecutorConfig,
};

const setReceiveConfigParam = {
  eid: remoteEid,
  configType: ULN_CONFIG_TYPE,
  config: encodedUlnConfig,
};

async function main() {
  ValidateEnvironmentVariables([ETH_OFT_ADDRESS, ETH_SEND_LIB_ADDRESS, ETH_RECEIVE_LIB_ADDRESS, ETH_ENDPOINT_CONTRACT_ADDRESS, 
    DESTINATION_EID, PAXOS_DVN_ADDRESS, LZ_DVN_ADDRESS, GOOGLE_DVN_ADDRESS, HORIZON_DVN_ADDRESS, NETHER_DVN_ADDRESS, 
    CONFIRMATIONS, MAX_MESSAGE_SIZE, EXECUTOR_ADDRESS, NETWORK,
    NETWORK_URL, PRIVATE_KEY])
  PrintDeployerDetails();
  await setLibraries();
  await setSendConfig();
  await setReceiveConfig();
}

async function setLibraries() {
  try {
    // Set the send library
    const sendTx = await endpointContract.setSendLibrary(
      ETH_OFT_ADDRESS,
      remoteEid,
      ETH_SEND_LIB_ADDRESS,
    );
    console.log('Send library transaction sent:', sendTx.hash);
    await sendTx.wait();
    console.log('Send library set successfully.');

    // Set the receive library
    const receiveTx = await endpointContract.setReceiveLibrary(
      ETH_OFT_ADDRESS,
      remoteEid,
      ETH_RECEIVE_LIB_ADDRESS,
    );
    console.log('Receive library transaction sent:', receiveTx.hash);
    await receiveTx.wait();
    console.log('Receive library set successfully.');
  } catch (error) {
    console.error('Transaction failed:', error);
  }
}

async function setSendConfig() {
  try {
    const tx = await endpointContract.setConfig(
      ETH_OFT_ADDRESS,
      ETH_SEND_LIB_ADDRESS,
      [setConfigParamUln, setConfigParamExecutor], // Array of SetConfigParam structs
    );

    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt.transactionHash);
  } catch (error) {
    console.error('Transaction failed:', error);
  }
}

async function setReceiveConfig() {
  try {
    const tx = await endpointContract.setConfig(
        ETH_OFT_ADDRESS,
        ETH_RECEIVE_LIB_ADDRESS,
        [setReceiveConfigParam], // This should be an array of SetConfigParam structs
    );

    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt.transactionHash);
    } catch (error) {
    console.error('Transaction failed:', error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
});
