// contracts/MetadataRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "./IMDRTCore.sol";

//
// @dev Interface for the {MDRTWithRefSpec} contract.
//
interface IMDRTRefSpec {
	/// @notice Tracks the current seqNum and any per token refSpec.
	/// @param seqNum Each update to the data uri of a token will increment the sequence number.
	/// @param refSpec Each token can have an refSpec that outlines how to reference / access the data
	///  available at the token URI.
	struct RefInfo {
		uint256 seqNum;
		string refSpec;
	}

	/// @notice Emitted when the ref spec for a token is updated.
	/// @param by The account that caused the refSpec update.
	/// @param tokenId The token updated.
	/// @param newInfo The updated refSpec info.
	event RefSpecUpdate(address indexed by, uint256 indexed tokenId, RefInfo newInfo);

	/// @notice Emitted when the default ref spec for the contract is updated.
	/// @param by The account that caused the refSpec update.
	/// @param tokenId Tokens from this token id will be subject to the new default refSpec.
	/// @param newSpec The updated default refSpec.
	event DefaultRefSpecUpdate(address indexed by, uint256 indexed tokenId, string newSpec);

	/// @notice Updates the default ref spec.
	/// @dev Will emit a DefaultRefSpecUpdate event (see above).
	/// @param newSpec The updated default refSpec.
	function updateDefaultRefSpec(string memory newSpec) external;

	/// @notice Get the current seqNum associated with the tokenURI.
	/// @param tokenId The applicable tokenId.
	/// @return the current seqNum for the token.
	function seqNum(uint256 tokenId) external view returns (uint256);

	/// @notice Get the current refSpec associated with the tokenURI.
	/// @dev If not set and there is a default refSpec then the default refSpec will be returned.
	/// @param tokenId The applicable tokenId.
	/// @return the current refSpec for the token.
	function refSpec(uint256 tokenId) external view returns (string memory);

	/// @notice Set the current refSpec associated with the tokenURI.
	/// @param tokenId The applicable tokenId.
	/// @param newSpec The new refSpec
	function updateRefSpec(uint256 tokenId, string memory newSpec) external;
}
