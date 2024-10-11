
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { EndpointV2 } from "@layerzerolabs/lz-evm-protocol-v2/contracts/EndpointV2.sol";

//Used for testing only
contract LzEndpointFixture is EndpointV2 {

    constructor(uint32 _eid, address _owner) EndpointV2(_eid, _owner) {}
}