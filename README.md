# cross-chain-contracts-internal
This repository contains contracts to support cross chain bridging on EVM chains. The main contract is
[OFTWrapper](contracts/OFTWrapper.sol) which supports bridging using LayerZero.

## OFTWrapper
This contract is a proxy around LayerZero's OFT standard. The `OFTWrapper` can be called 
by LayerZero to mint and burn tokens like normal. The `OFTWrapper` then forwards those requests
to the underlying token. The underlying token must grant this contract permission to mint and burn.

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