// contracts/MetadataRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../MDRTWithRunState.sol";

///
/// @title  Metadata Reference Token Contract (with both runState only
/// functionality)
/// @author Robin Shorrock
///
/// @notice This contract bundles the runState functionality into the MDRTCore
/// contract and can be deployed directly.
///
contract MDRTWithRunStateOnly is MDRTWithRunState {
	// @notice Invoke the primary MDRTCore constructor
	constructor(string memory name, string memory symbol) MDRTCore(name, symbol) {}
}
