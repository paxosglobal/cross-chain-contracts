// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import { OFTCoreUpgradeable } from "@layerzerolabs/oft-evm-upgradeable/contracts/oft/OFTCoreUpgradeable.sol";
import { IOFT } from "@layerzerolabs/oft-evm/contracts/interfaces/IOFT.sol";
import { RateLimiter } from "@layerzerolabs/oapp-evm/contracts/oapp/utils/RateLimiter.sol";
import { PaxosTokenV2 } from "PaxosToken/contracts/PaxosTokenV2.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title OFTWrapperUpgradeable
 * @dev This contract is a UUPS upgradeable proxy around LayerZero's OFT standard. The OFTWrapper can be called
 * by LayerZero to mint and burn tokens like normal. The OFTWrapper then forwards those requests
 * to the underlying token. The underlying token must grant this contract permission to mint and burn.
 *
 * This contract implements both outbound rate limiting (limits how much can be sent to a destination)
 * and inbound rate limiting (limits how much can be received from a source).
 *
 * Both inbound and outbound rate limits use the same RateLimiter storage, differentiated by an offset
 * added to inbound endpoint IDs to ensure they never collide with outbound endpoint IDs.
 *
 * @custom:security-contact smart-contract-security@paxos.com
 */
contract OFTWrapperUpgradeable is OFTCoreUpgradeable, RateLimiter, UUPSUpgradeable {
    // ============ Constants ============

    /// @notice Offset added to source endpoint IDs for inbound rate limiting
    /// @dev Ensures inbound and outbound rate limits use separate storage slots
    uint32 private constant INBOUND_EID_OFFSET = 1000000000;

    // ============ Immutables ============

    /// @notice The Paxos token
    PaxosTokenV2 public immutable paxosToken;

    // ============ Events ============

    /**
     * @notice Emitted when inbound rate limits are changed.
     * @param rateLimitConfigs An array of `RateLimitConfig` structs representing the rate limit configurations set.
     */
    event InboundRateLimitsChanged(RateLimitConfig[] rateLimitConfigs);

    // ============ Constructor ============

    /**
     * @dev Constructor for the OFT wrapper contract. Disables initializers to prevent
     * initialization of the implementation contract.
     * @param _localDecimals The decimals of the token on the local chain.
     * @param _lzEndpoint The LayerZero endpoint address.
     */
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(
        uint8 _localDecimals,
        address _lzEndpoint,
        address _paxosToken
    ) OFTCoreUpgradeable(_localDecimals, _lzEndpoint) {
        require(_paxosToken != address(0), "OFTWrapper: zero paxosToken");
        paxosToken = PaxosTokenV2(_paxosToken);
        _disableInitializers();
    }

    // ============ Initializer ============

    /**
     * @dev Initializes the upgradeable contract.
     * @param _delegate The delegate capable of making OApp configurations inside of the endpoint.
     * @param _owner The initial owner of the contract.
     */
    function initialize(
        address _delegate,
        address _owner
    ) public initializer {
        require(_delegate != address(0), "OFTWrapper: zero delegate");
        require(_owner != address(0), "OFTWrapper: zero owner");

        __Ownable_init();
        __OFTCore_init(_delegate);
        __UUPSUpgradeable_init();

        // OZ 4.x __Ownable_init sets owner to msg.sender, so transfer to desired owner
        if (_owner != msg.sender) {
            _transferOwnership(_owner);
        }
    }

    // ============ UUPS Authorization ============

    /**
     * @dev Authorizes an upgrade to a new implementation. Only callable by the owner.
     * @param newImplementation The address of the new implementation contract.
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ============ OFT Implementation ============

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

    // ============ Outbound Rate Limiting ============

    /**
     * @dev Sets the outbound rate limits based on RateLimitConfig array. Only callable by the owner.
     * @param _rateLimitConfigs An array of RateLimitConfig structures defining the rate limits.
     */
    function setOutboundRateLimits(
        RateLimitConfig[] calldata _rateLimitConfigs
    ) external onlyOwner {
        _setRateLimits(_rateLimitConfigs);
    }

    // ============ Inbound Rate Limiting ============

    /**
     * @dev Sets the inbound rate limits based on RateLimitConfig array. Only callable by the owner.
     * @param _rateLimitConfigs An array of RateLimitConfig structures (dstEid field is used as srcEid).
     */
    function setInboundRateLimits(
        RateLimitConfig[] calldata _rateLimitConfigs
    ) external onlyOwner {
        _setInboundRateLimits(_rateLimitConfigs);
    }

    /**
     * @notice Get the current amount that can be received from this source endpoint id for the given rate limit window.
     * @param _srcEid The source endpoint id.
     * @return currentAmountInFlight The current amount in flight.
     * @return amountCanBeReceived The amount that can be received.
     */
    function getAmountCanBeReceived(
        uint32 _srcEid
    ) external view returns (uint256 currentAmountInFlight, uint256 amountCanBeReceived) {
        RateLimit memory rl = rateLimits[_srcEid + INBOUND_EID_OFFSET];
        return _amountCanBeSent(rl.amountInFlight, rl.lastUpdated, rl.limit, rl.window);
    }

    /**
     * @notice Returns the inbound rate limit configuration for a source endpoint.
     * @param _srcEid The source endpoint id.
     * @return The inbound rate limit configuration.
     */
    function inboundRateLimits(uint32 _srcEid) external view returns (RateLimit memory) {
        return rateLimits[_srcEid + INBOUND_EID_OFFSET];
    }

    /**
     * @notice Sets the inbound rate limits by applying offset to endpoint IDs.
     * @param _rateLimitConfigs An array of RateLimitConfig structures (dstEid field is used as srcEid).
     */
    function _setInboundRateLimits(RateLimitConfig[] memory _rateLimitConfigs) internal {
        RateLimitConfig[] memory offsetConfigs = new RateLimitConfig[](_rateLimitConfigs.length);
        for (uint256 i = 0; i < _rateLimitConfigs.length; i++) {
            offsetConfigs[i] = RateLimitConfig({
                dstEid: _rateLimitConfigs[i].dstEid + INBOUND_EID_OFFSET, //Used as the srcEid
                limit: _rateLimitConfigs[i].limit,
                window: _rateLimitConfigs[i].window
            });
        }
        _setRateLimits(offsetConfigs);
        emit InboundRateLimitsChanged(_rateLimitConfigs);
    }

    // ============ OFT Core Overrides ============

    /**
     * @dev Internal function to perform a debit operation. Calls the underlying token
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
        _outflow(_dstEid, amountSentLD);
        paxosToken.decreaseSupplyFromAddress(amountSentLD, _from);
    }

    /**
     * @dev Internal function to perform a credit operation. Calls the underlying token
     * to perform the mint via `increaseSupplyToAddress`.
     * @param _to The address to credit.
     * @param _amountLD The amount to credit in local decimals.
     * @param _srcEid The source endpoint ID.
     * @return amountReceivedLD The amount received in local decimals.
     */
    function _credit(
        address _to,
        uint256 _amountLD,
        uint32 _srcEid
    ) internal override returns (uint256 amountReceivedLD) {
        _outflow(_srcEid + INBOUND_EID_OFFSET, _amountLD);
        paxosToken.increaseSupplyToAddress(_amountLD, _to);
        return _amountLD;
    }
}
