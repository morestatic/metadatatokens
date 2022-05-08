// contracts/MetadataRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../MDRTWithRefSpec.sol";

///
/// @title  Metadata Reference Token Contract (with both refSpec only
/// functionality)
/// @author Robin Shorrock
///
/// @notice This contract bundles the refSpec functionality into the MDRTCore
/// contract and can be deployed directly.
///
contract MDRTWithRefSpecOnly is MDRTWithRefSpec {
	// @notice Invoke the primary MDRTCore constructor
	constructor(string memory name, string memory symbol) MDRTCore(name, symbol) {}
}
