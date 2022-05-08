// contracts/MetadataRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "./MDRTCore.sol";
import "./IMDRTRunState.sol";

///
/// @title  Metadata Reference Token Contract (with runState functionality)
/// @author Robin Shorrock
///
/// @notice This contract extends the MDRTCore contract with behaviour supporting
/// the IMDRTRunState interface. The runState functionality add support for four
/// run states that can be controlled by the contract owner and Registry
/// Managers. These are:
/// - Ok ALl running ok with no restrictions.
/// - ReadOnly Token URIs can only be read from the contract.
/// - Paused No reading or updating allowed.
/// - Halted No reading or updating allowed. Once halted the contract cannot be
///   re-started. Halting can only performed by the contract owner.
///
/// Note: This is an abstract contract as the functionality can be bundled with
/// the MDRTWithRefSpec contract. See the bundles folder for directly useable
/// contracts.
///
abstract contract MDRTWithRunState is MDRTCore {
	/// @notice Defines the allowable run states.
	enum RunningState {
		Ok,
		ReadOnly,
		Paused,
		Halted
	}

	/// @notice Contains the current running state for the registry.
	RunningState private _runningState = RunningState.Ok;

	// @notice Invoke the primary MDRTCore constructor
	// constructor(string memory name, string memory symbol) MDRTCore(name, symbol) {}

	/// @inheritdoc	IMDRTRunState
	function setRunningState(uint8 newState) public virtual override {
		isNotHaltedCheck();
		if (RunningState(newState) == RunningState.Halted) {
			require(isOwner(), "must be owner to halt");
		}
		_onlyRegistryManagersCheck();
		_runningState = RunningState(newState);
	}

	/// @inheritdoc	IMDRTRunState
	function getRunningState() public view virtual override returns (uint8) {
		isNotHaltedCheck();
		return uint8(_runningState);
	}

	/// @inheritdoc	IMDRTRunState
	function isNotHaltedCheck() public view virtual override {
		require(_runningState != RunningState.Halted, "c! is halted");
	}

	/// @inheritdoc	IMDRTRunState
	function isReadableCheck() public view virtual override {
		require(_runningState != RunningState.Halted, "c! is halted");
		require(_runningState != RunningState.Paused, "c! is paused");
	}

	/// @inheritdoc	IMDRTRunState
	function isWriteableCheck() public view virtual override {
		require(_runningState != RunningState.Halted, "c! is halted");
		require(_runningState != RunningState.Paused, "c! is paused");
		require(_runningState != RunningState.ReadOnly, "c! is read only");
	}
}
