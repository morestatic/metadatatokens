// contracts/MetadataRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "./IMDRTCore.sol";

//
// @dev Interface for the {MDRTWithRunState} contract.
//
interface IMDRTRunState {
	/// @notice Control the running state of the contract. Limited by role (see above).
	/// @param newState The new running state.
	function setRunningState(uint8 newState) external;

	/// @notice Get the current running state
	/// @return The current running state.
	function getRunningState() external view returns (uint8);

	/// @notice Reverts if the contract is halted.
	function isNotHaltedCheck() external view;

	/// @notice Reverts if the contract is not readable.
	function isReadableCheck() external view;

	/// @notice Reverts if the contract is not writable.
	function isWriteableCheck() external view;
}
