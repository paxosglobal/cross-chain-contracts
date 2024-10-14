const { ethers } = require("hardhat");
const { ValidateEnvironmentVariables } = require('./utils/helpers');

const { ETH_OFT_ADDRESS, ETH_SEND_LIB_ADDRESS, ETH_RECEIVE_LIB_ADDRESS, ETH_ENDPOINT_CONTRACT_ADDRESS, DESTINATION_EID, NETWORK_URL } = process.env;

const provider = new ethers.providers.JsonRpcProvider(NETWORK_URL);

// Define the smart contract address and ABI
const ethereumLzEndpointAddress = ETH_ENDPOINT_CONTRACT_ADDRESS;
const ethereumLzEndpointABI = [
  'function getConfig(address _oapp, address _lib, uint32 _eid, uint32 _configType) external view returns (bytes memory config)',
];

// Create a contract instance
const contract = new ethers.Contract(ethereumLzEndpointAddress, ethereumLzEndpointABI, provider);

// Define the addresses and parameters
const oftAddress = ETH_OFT_ADDRESS;
const sendLibAddress = ETH_SEND_LIB_ADDRESS; //SendLib302
const receiveLibAddress = ETH_RECEIVE_LIB_ADDRESS; //ReceiveLib302
const remoteEid = DESTINATION_EID; //Remote endpoint id
const EXECUTOR_CONFIG_TYPE= 1; // 1 for executor
const ULN_CONFIG_TYPE = 2; // 2 for UlnConfig

async function getConfigAndDecode() {
  ValidateEnvironmentVariables([ETH_OFT_ADDRESS, ETH_SEND_LIB_ADDRESS, ETH_RECEIVE_LIB_ADDRESS, ETH_ENDPOINT_CONTRACT_ADDRESS, DESTINATION_EID, NETWORK_URL])
  try {
    // Fetch and decode for sendLib (both Executor and ULN Config)
    const sendExecutorConfigBytes = await contract.getConfig(
      oftAddress,
      sendLibAddress,
      remoteEid,
      EXECUTOR_CONFIG_TYPE,
    );
    const executorConfigAbi = ['tuple(uint32 maxMessageSize, address executorAddress)'];
    const executorConfigArray = ethers.utils.defaultAbiCoder.decode(
      executorConfigAbi,
      sendExecutorConfigBytes,
    );
    console.log('Send Library Executor Config:', executorConfigArray);

    const sendUlnConfigBytes = await contract.getConfig(
      oftAddress,
      sendLibAddress,
      remoteEid,
      ULN_CONFIG_TYPE,
    );
    const ulnConfigStructType = [
      'tuple(uint64 confirmations, uint8 requiredDVNCount, uint8 optionalDVNCount, uint8 optionalDVNThreshold, address[] requiredDVNs, address[] optionalDVNs)',
    ];
    const sendUlnConfigArray = ethers.utils.defaultAbiCoder.decode(
      ulnConfigStructType,
      sendUlnConfigBytes,
    );
    console.log('Send Library ULN Config:', sendUlnConfigArray);

    // Fetch and decode for receiveLib (only ULN Config)
    const receiveUlnConfigBytes = await contract.getConfig(
      oftAddress,
      receiveLibAddress,
      remoteEid,
      ULN_CONFIG_TYPE,
    );
    const receiveUlnConfigArray = ethers.utils.defaultAbiCoder.decode(
      ulnConfigStructType,
      receiveUlnConfigBytes,
    );
    console.log('Receive Library ULN Config:', receiveUlnConfigArray);
  } catch (error) {
    console.error('Error fetching or decoding config:', error);
  }
}

// Execute the function
getConfigAndDecode();