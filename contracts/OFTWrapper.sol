// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {OFTCore, IOFT} from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFTCore.sol";
import {PaxosTokenV2} from "PaxosToken/contracts/PaxosTokenV2.sol";

/**
 * @title OFTWrapper
 * @dev This contract is a proxy around LayerZero's OFT standard.  The OFTWrapper can be called
 * by LayerZero to mint and burn tokens like normal.  The OFTWrapper then forwards those requests
 * to the underlying token.  The underlying token must grant this contract permission to mint and burn.
 */
contract OFTWrapper is OFTCore {
    //The Paxos token
    PaxosTokenV2 private immutable paxosToken;

    /**
     * @dev Constructor for the OFT wrapper contract.
     * @param _paxosToken The address of the Paxos token
     * @param _lzEndpoint The LayerZero endpoint address.
     * @param _delegate The delegate capable of making OApp configurations inside of the endpoint.
     */
    constructor(
        address _paxosToken,
        address _lzEndpoint,
        address _delegate
    ) OFTCore(6, _lzEndpoint, _delegate) {
        paxosToken = PaxosTokenV2(_paxosToken);
    }

    /**
     * @dev See {OFTCore-oftVersion}
     */
    function oftVersion()
        external
        pure
        override
        returns (bytes4 interfaceId, uint64 version)
    {
        return (type(IOFT).interfaceId, 1);
    }

    /**
     * @dev Returns underlying token address
     */
    function token() public view override returns (address) {
        return address(paxosToken);
    }

    /**
     * @dev See {OFTCore-approvalRequired}
     */
    function approvalRequired() external pure returns (bool) {
        return false;
    }

    /**
     * @dev Internal function to perform a debit operation.  Calls the underlying token
     * to perform the burn via `decreaseSupplyFromAddress`.
     * @param _from The address to debit.
     * @param _amountLD The amount to send in local decimals.
     * @param _minAmountLD The minimum amount to send in local decimals.
     * @param _dstEid The destination endpoint ID.
     * @return amountSentLD The amount sent in local decimals.
     * @return amountReceivedLD The amount received in local decimals on the remote.
     */
    function _debit(
        address _from,
        uint256 _amountLD,
        uint256 _minAmountLD,
        uint32 _dstEid
    )
        internal
        override
        returns (uint256 amountSentLD, uint256 amountReceivedLD)
    {
        (amountSentLD, amountReceivedLD) = _debitView(
            _amountLD,
            _minAmountLD,
            _dstEid
        );
        paxosToken.decreaseSupplyFromAddress(amountSentLD, _from);
    }

    /**
     * @dev Internal function to perform a credit operation. Calls the underlying token
     * to perform the mint via `increaseSupplyToAddress`.
     * @param _to The address to credit.
     * @param _amountLD The amount to credit in local decimals.
     * @return amountReceivedLD The amount received in local decimals.
     */
    function _credit(
        address _to,
        uint256 _amountLD,
        uint32 /*_srcEid*/
    ) internal override returns (uint256 amountReceivedLD) {
        paxosToken.increaseSupplyToAddress(_amountLD, _to);
        return _amountLD;
    }
}
