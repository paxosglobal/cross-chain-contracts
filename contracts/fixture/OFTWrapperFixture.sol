
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { OFTWrapper } from "../OFTWrapper.sol";

//For testing purposes only
contract OFTWrapperFixture is OFTWrapper {

    constructor(
        address _tokenAddress,
        address _lzEndpoint,
        address _delegate
    ) OFTWrapper(_tokenAddress, _lzEndpoint, _delegate) {
    }

    //Used to test the _debit internal function directly
    function debit(
        address _from,
        uint256 _amountLD,
        uint256 _minAmountLD,
        uint32 _dstEid
    ) public returns (uint256 amountSentLD, uint256 amountReceivedLD) {
        return _debit(_from, _amountLD, _minAmountLD, _dstEid);
    }

    //Used to test the _credit internal function directly
    function credit(
        address _to,
        uint256 _amountLD,
        uint32 _srcEid
    ) public returns (uint256) {
        return _credit(_to, _amountLD, _srcEid);
    }

}