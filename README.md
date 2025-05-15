# Cross Chain Contracts
This repository contains contracts to support cross chain bridging on EVM chains. The main contract is
[OFTWrapper](contracts/OFTWrapper.sol) which supports bridging using LayerZero.

## OFTWrapper
`OFTWrapper` serves as a proxy for LayerZero's OFT standard, allowing LayerZero to mint and burn tokens as usual, 
which includes the same AML standards as a same chain transfer. When LayerZero initiates a mint or burn request, 
the `OFTWrapper` forwards it to the underlying token contract. For this to work, the underlying token must authorize 
`OFTWrapper` to perform minting and burning operations on its behalf.

## Audits
Audits were performed by both Zellic and Trail of Bits.  Audit reports can be found [here](audits/).

## Upgrade process
`OFTWrapper` is a non-upgradeable contract. If a change needs to be made a new contract should be deployed.
The underlying token should then revoke mint and burn permissions on the old contract and grant mint and burn
permissions to the new contract.

## Contract Tests
Install dependencies:

`npm install`

Compile the contracts:

`npx hardhat compile`

Run unit tests:

`npx hardhat test`

Check test coverage:

`npx hardhat coverage`

## Sending a cross chain transaction
The `send` function is used to send a cross chain transaction. Prior to running `send` you must first estimate the
gas to be used with `quoteSend`.

Arguments of `quoteSend`:
1. `SendParam`: what parameters should be used for the send call?
```
/**
 * @dev Struct representing token parameters for the OFT send() operation.
 */
 struct SendParam {
     uint32 dstEid; // Destination endpoint ID.
     bytes32 to; // Recipient address.
     uint256 amountLD; // Amount to send in local decimals.
     uint256 minAmountLD; // Minimum amount to send in local decimals.
     bytes extraOptions; // Additional options supplied by the caller to be used in the LayerZero message.
     bytes composeMsg; // The composed message for the send() operation.
     bytes oftCmd; // The OFT command to be executed, unused in default OFT implementations.
 }
 ```
 2. `_payInLzToken`: what token will be used to pay for the transaction?

 Return value of `quoteSend`:
 1. `MessagingFee`: Passed into the `send` function call
 ```
 struct MessagingFee {
    uint nativeFee; // gas amount in native gas token
    uint lzTokenFee; // gas amount in ZRO token
}
```

After calling `quoteSend` you can call `send` with the following arguments:
1. `SendParam`
2. `MessagingFee`
3. `refundAddress`

Also include the value as the `MessaagingFee.nativeFee` amount.

### Function signatures
`send` function signature:
```send((uint32,bytes32,uint256,uint256,bytes,bytes,bytes),(uint256,uint256),address)```

`quoteSend` function signature:
```quoteSend((uint32,bytes32,uint256,uint256,bytes,bytes,bytes),bool)```

### Using the hardhat script
This repo provides a script to test calling `send` via hardhat. First create a .env file with the following:
```
URL_ETH_MAINNET=""
URL_ETH_SEPOLIA=""
PRIVATE_KEY="" #Private key for sender
EVM_OFT_ADDRESS=""
RECIPIENT_ADDRESS=""
DESTINATION_EID="" #Endpoint id value from https://docs.layerzero.network/v2/deployments/deployed-contracts
REFUND_ADDRESS="" #Can be the same as the sender
AMOUNT="1000000" #Use 1000000 for tokens with 6 decimals to send 1 token
```

Run the following commands:
```
npm install
npx hardhat compile
npx hardhat run scripts/send.js --network ethSepolia
```

Note: You may need to add a new network into `hardhat.config.js` if the network you want to send from isn't already there.
