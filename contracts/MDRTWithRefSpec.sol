// contracts/MetadataRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "./MDRTCore.sol";
import "./IMDRTRefSpec.sol";

///
/// @title  Metadata Reference Token Contract (with refSpec functionality)
/// @author Robin Shorrock
/// @notice This contract extends the MDRTCore contract with behaviour supporting
/// the IMDRTRefSpec interface. The refSpec functionality adds an additional
/// field to the contract which can be used for additional information about
/// using the tokenURI field in the core contract. For example, this could be a
/// URI to a json schema, or to a public key to verify the producer of the
/// content store at the tokenURI, a combination of these, or something
/// completely different.
///
/// Note: This is an abstract contract as the functionality can be bundled with
/// the MDRTWithRunState contract. See the bundles folder for directly useable
/// contracts.
///
abstract contract MDRTWithRefSpec is MDRTCore, IMDRTRefSpec {
	using Counters for Counters.Counter;

	// @notice Invoke the primary MDRTCore constructor
	// constructor(string memory name, string memory symbol) MDRTCore(name, symbol) {}

	/// @notice Provide a default ref spec for tokens that don't explicitly set their refSpec.
	string private _defaultRefSpec = "";

	/// @notice Maintains the seqNum and refSpec for a token.
	mapping(uint256 => RefInfo) private _refInfo;

	/// @inheritdoc	IMDRTRefSpec
	function updateDefaultRefSpec(string memory newSpec) public {
		isWriteableCheck();
		_onlyRegistryManagersCheck();
		_defaultRefSpec = newSpec;

		emit DefaultRefSpecUpdate(msg.sender, _tokenIdsCount.current() + 1, newSpec);
	}

	/// @inheritdoc	IMDRTRefSpec
	function seqNum(uint256 tokenId) public view returns (uint256) {
		isReadableCheck();
		tokenExistsCheck(tokenId);
		return _getSeqNum(tokenId);
	}

	/// @inheritdoc	IMDRTRefSpec
	function refSpec(uint256 tokenId) public view returns (string memory) {
		isReadableCheck();
		tokenExistsCheck(tokenId);
		string memory spec = _refInfo[tokenId].refSpec;
		if (bytes(spec).length == 0) {
			spec = _defaultRefSpec;
		}
		return spec;
	}

	/// @inheritdoc	IMDRTRefSpec
	function updateRefSpec(uint256 tokenId, string memory newSpec) public {
		isWriteableCheck();
		tokenExistsCheck(tokenId);
		_onlyTokenManagersCheck(tokenId);
		_refInfo[tokenId].refSpec = newSpec;

		emit RefSpecUpdate(msg.sender, tokenId, _refInfo[tokenId]);
	}

	/// @dev Overwrite the internal _setTokenURI function to increment/include seqNum on updates.
	/// @inheritdoc MDRTCore
	function _setTokenURI(uint256 tokenId, string memory newTokenURI) internal virtual override tokenExists(tokenId) {
		_incrementSeqNum(tokenId);
		super._setTokenURI(tokenId, newTokenURI);
		emit TokenURIUpdate(msg.sender, tokenId, newTokenURI, _getSeqNum(tokenId));
	}

	/// @dev Overwrite the internal _burn function to remove any refInfo on token burn.
	/// @param tokenId The applicable token.
	/// @inheritdoc MDRTCore
	function _burn(uint256 tokenId) internal virtual override {
		_removeRefInfo(tokenId);
		super._burn(tokenId);
	}

	/// @dev Removes any ref info associated with a token.
	/// @param tokenId The applicable token.
	function _removeRefInfo(uint256 tokenId) internal {
		if (_refInfo[tokenId].seqNum != 0) {
			delete _refInfo[tokenId];
		}
	}

	/// @dev Increment the seqNum associated with a token.
	/// @param tokenId The applicable token.
	function _incrementSeqNum(uint256 tokenId) internal {
		_refInfo[tokenId].seqNum = _refInfo[tokenId].seqNum + 1;
	}

	/// @dev Get the seqNum for a token.
	/// @param tokenId The applicable token.
	function _getSeqNum(uint256 tokenId) internal view virtual returns (uint256) {
		return _refInfo[tokenId].seqNum;
	}

}
