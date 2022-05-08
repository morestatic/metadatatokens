// contracts/MetadataRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../MDRTWithRunState.sol";
import "../MDRTWithRefSpec.sol";

///
/// @title  Metadata Reference Token Contract (with both refSpec and runState
/// functionality)
/// @author Robin Shorrock
///
/// @notice This contract bundles the runState and refSpec functionality into
/// the MDRTCore contract and can be deployed directly.
///
contract MDRTFull is MDRTWithRunState, MDRTWithRefSpec {
	// @notice Invoke the primary MDRTCore constructor
	constructor(string memory name, string memory symbol) MDRTCore(name, symbol) {}

	// @dev need to override _burn to choose which underlying implementation to call.
	// @inheritdoc MDRTWithRefSpec
	function _burn(uint256 tokenId) internal virtual override(MDRTCore, MDRTWithRefSpec) {
		MDRTWithRefSpec._burn(tokenId);
	}

	// @dev need to override _setTokenURI to choose which underlying implementation to call.
	// @inheritdoc MDRTWithRefSpec
	function _setTokenURI(uint256 tokenId, string memory _tokenURI)
		internal
		virtual
		override(MDRTCore, MDRTWithRefSpec)
		tokenExists(tokenId)
	{
		MDRTWithRefSpec._setTokenURI(tokenId, _tokenURI);
	}

	// @inheritdoc MDRTWithRunState
	function setRunningState(uint8 newState) public virtual override(MDRTCore, MDRTWithRunState) {
		MDRTWithRunState.setRunningState(newState);
	}

	// @inheritdoc MDRTWithRunState
	function getRunningState() public view virtual override(MDRTCore, MDRTWithRunState) returns (uint8) {
		return MDRTWithRunState.getRunningState();
	}

	// @inheritdoc MDRTWithRunState
	function isNotHaltedCheck() public view virtual override(MDRTCore, MDRTWithRunState) {
		MDRTWithRunState.isNotHaltedCheck();
	}

	// @inheritdoc MDRTWithRunState
	function isReadableCheck() public view virtual override(MDRTCore, MDRTWithRunState) {
		MDRTWithRunState.isReadableCheck();
	}

	// @inheritdoc MDRTWithRunState
	function isWriteableCheck() public view virtual override(MDRTCore, MDRTWithRunState) {
		MDRTWithRunState.isWriteableCheck();
	}
}
