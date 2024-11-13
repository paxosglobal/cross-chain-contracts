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
