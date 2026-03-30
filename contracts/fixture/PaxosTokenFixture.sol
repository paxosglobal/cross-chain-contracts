
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { PaxosTokenV2 } from "PaxosToken/contracts/PaxosTokenV2.sol";

//For testing purposes only
contract PaxosTokenFixture is PaxosTokenV2 {
    function increaseSupplyToAddress(uint256 value, address mintToAddress) public override returns (bool success) {
        require(!_isAddrFrozen(mintToAddress), "mintToAddress frozen");
        balances[mintToAddress] += value;
        return true;
    }

    function decreaseSupplyFromAddress(uint256 value, address burnFromAddress) public override returns (bool success) {
        require(!_isAddrFrozen(burnFromAddress), "burnFromAddress frozen");
        balances[burnFromAddress] -= value;
        return true;
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @dev Test helper to freeze/unfreeze addresses without requiring ASSET_PROTECTION_ROLE setup
    function setFrozen(address addr, bool isFrozen) external {
        frozen[addr] = isFrozen;
    }
}
