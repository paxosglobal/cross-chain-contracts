
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { PaxosTokenV2 } from "PaxosToken/contracts/PaxosTokenV2.sol";

//For testing purposes only
contract PaxosTokenFixture is PaxosTokenV2 {
    function increaseSupplyToAddress(uint256 value, address mintToAddress) public override returns (bool success) {
        balances[mintToAddress] += value;
        return true;
    }

    function decreaseSupplyFromAddress(uint256 value, address burnFromAddress) public override returns (bool success) {
        balances[burnFromAddress] -= value;
        return true;
    }
}