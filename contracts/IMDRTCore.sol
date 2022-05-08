// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

//
// @dev Interface for the {MDRTCore} contract.
//
interface IMDRTCore is IERC721, IERC721Metadata {
	/// @dev Defines the various admin roles related to the metadata reference token.
	enum Roles {
		NONE,
		REGISTRY_OWNER,
		REGISTRY_MANAGER,
		TOKEN_CREATOR,
		TOKEN_MANAGER
	}

	/// @dev The ChangeType enum is used to describe whether an account was granted or revoked.
	enum ChangeType {
		Grant,
		Revoke
	}

	/// @notice Emitted when the token URI is changed.
	/// @param by The address that requested the permissions change.
	/// @param tokenId The token that was changed.
	/// @param seqNum Updated after each change (only when using refSpecs - otherwise will be zero)
	event TokenURIUpdate(address indexed by, uint256 tokenId, string indexed uri, uint256 seqNum);

	/// @notice Emitted when registry managers are granted or revoked.
	/// @param manager The address for whom permissions were granted or revoked.
	/// @param by The address that requested the permissions change.
	/// @param changeType Indicates whether was a Grant or Revoke.
	event RegistryManagerUpdate(address indexed manager, address indexed by, ChangeType changeType);

	/// @notice Emitted when token managers are granted or revoked.
	/// @param manager The address for whom permissions were granted or revoked.
	/// @param by The address that requested the permissions change.
	/// @param tokenId The token for which token manager permissions were granted or revoked.
	/// @param changeType Indicates whether was a Grant or Revoke.
	event TokenManagerUpdate(address indexed manager, address indexed by, uint256 indexed tokenId, ChangeType changeType);

	/// @notice Creates a new metadata reference token with the metadata uri included.
	/// @param metadataURI The initial URI to be used as the tokenURI for the token.
	function mint(string memory metadataURI) external;

	/// @notice Destroys a token and removes any token managers and related info.
	/// @param tokenId Token to burn.
	function burn(uint256 tokenId) external;

	/// @notice Get the token URI.
	/// @param tokenId The Token for which to get the token URI.
	/// @return the token URI associated with the token.
	function dataURI(uint256 tokenId) external view returns (string memory);

	/// @notice Get the token URI associated with the token.
	/// @param tokenId The Token for which to get the token URI.
	/// @return the token URI associated with the token.
	function tokenURI(uint256 tokenId) external view returns (string memory);

	/// @notice Update the metadata tokenURI associated with the tokenId.
	/// @param tokenId the token to update.
	/// @param metadataURI the new tokenURI to associated with the token.
	function updateDataURI(uint256 tokenId, string memory metadataURI) external;

	/// @notice Update the tokenURI associated with the tokenId.
	/// @param tokenId the token to update.
	/// @param newTokenURI the new tokenURI to associated with the token.
	function setTokenURI(uint256 tokenId, string calldata newTokenURI) external;

	/// @notice Grant the requested role to the account indicated.
	/// @param role The role representing the permissions desired.
	/// @param account The account to be granted the requested permissions.
	/// @param tokenId The token to which the role permissions apply (if relevant - otherwise use zero for
	/// the token Id)
	function grant(
		Roles role,
		address account,
		uint256 tokenId
	) external;

	/// @notice Revoke the specified role for the account indicated.
	/// @param role The role representing the permissions to be revoked.
	/// @param account The account who's permission are to be revoked.
	/// @param tokenId The applicable token (if relevant - otherwise use zero for
	/// the token Id)
	function revoke(
		Roles role,
		address account,
		uint256 tokenId
	) external;

	/// @notice Check if the specified account has the specified permissions.
	/// @param role The role representing the permissions to be checked.
	/// @param account The account who's permission are to be checked.
	/// @param tokenId The applicable token (if relevant - otherwise use zero for
	/// the token Id)
	function hasRole(
		Roles role,
		address account,
		uint256 tokenId
	) external view returns (bool);
}
