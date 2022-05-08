// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "./IMDRTCore.sol";
import "./IMDRTRunState.sol";

///
/// @title  Metadata Reference Token Contract Interface (core functionality)
/// @author Robin Shorrock
/// @notice This contract is based on the concept of a Metadata Reference Token
/// (MDRT). A Metadata Reference Token is a full ERC721 token that focuses
/// solely on the tokenURI element of an NFT, rather than the transactional and
/// ownership aspects.  The primary use case is to allow other metadata to
/// include stable references (important when content addressed metadata is
/// being used) to further metadata. A classic example is where a Music NFT
/// references metadata regarding the Music NFT itself but then that metadata
/// also includes references to other entities such as Artists, Labels or
/// Recordings.
///
/// The Metadata Reference Token allows those other references to be on-chain
/// entities that can be managed and updated independently of the referencing
/// metadata (e.g. the core Music NFT). Updates both in terms of the management
/// and any changes to actual reference are logged on-chain so there's a history
/// if and when changes are made.
///
/// This implementation is a proof of concept which adds three further
/// capabilities on top of basic access to an on-chain URL.
///
/// Firstly there are two extra admin roles in addition to the core ERC721
/// roles. These are for Registry and Token Managers. Registry Managers have
/// full control of all aspects of the contract (apart from they cannot `halt`
/// the contract - which can only be done by the contract / registry owner).
///
/// Token Managers are additional accounts that can update the TokenURI and
/// related RefSpec (see below) on-behalf of the Token Owner.
///
/// Secondly, there's support for an additional URI property for a field
/// containing a RefSpec. This field allows further metadata that describes how
/// to access the token metadata (extra meta!). For example, this could be a
/// link to json schema describing the metadata and/or public keys for
/// verification etc.
///
/// Finally, the contract can be halted, paused or made read-only, in addition
/// to the regular running behaviour.
///
/// Note that all existing ERC721 functionality is continued and ERC721 roles
/// (such as approvers etc) still exist and the related functionality isn't not
/// impacted by the the additional roles provided as part of the MDRT
/// implementation.
///
contract MDRTCore is ERC721, ERC721URIStorage, Ownable, IMDRTCore, IMDRTRunState {
	using SafeMath for uint256;
	using Counters for Counters.Counter;
	using EnumerableSet for EnumerableSet.AddressSet;

	/// @notice Total number of tokens minted by the registry.
	/// @dev Used to determine the next token id.
	Counters.Counter internal _tokenIdsCount;

	/// @notice Contains a list of accounts granted registry manager access.
	/// @dev Currently there's no max limit.
	EnumerableSet.AddressSet private _registryManagers;

	/// @notice Contains a list of accounts permitted to create/mint tokens.
	/// @dev Currently there's no max limit.
	EnumerableSet.AddressSet private _tokenCreators;

	/// @notice Contains a list of accounts granted token manager access to a token.
	/// @dev Currently there's no max limit.
	mapping(uint256 => EnumerableSet.AddressSet) private _tokenManagers;

	/// @notice Contains a list of accounts granted token manager access to a token.
	/// @dev Currently there's no max limit.
	constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

	/// @inheritdoc	IERC165
	function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, IERC165) returns (bool) {
		return
			// TODO: how should this be extended to support the other interfaces?
			interfaceId == type(IERC721).interfaceId ||
			interfaceId == type(IERC721Metadata).interfaceId ||
			super.supportsInterface(interfaceId);
	}

	/// @inheritdoc	ERC721
	function _beforeTokenTransfer(
		address from,
		address to,
		uint256 tokenId
	) internal virtual override(ERC721) {
		super._beforeTokenTransfer(from, to, tokenId);
	}

	/// @dev Caller must have permission to mint. Uses _safeMint and _safeTokenURI to update the
	/// ecessary ERC721 properties.
	/// @inheritdoc	IMDRTCore
	function mint(string memory metadataURI) external virtual {
		isWriteableCheck();
		_onlyTokenCreatorsCheck();
		require(bytes(metadataURI).length != 0, "token/data URI must not be empty");
		_tokenIdsCount.increment();
		_safeMint(msg.sender, _tokenIdsCount.current());
		_setTokenURI(_tokenIdsCount.current(), metadataURI);
	}

	/// @inheritdoc	IMDRTCore
	function burn(uint256 tokenId) public {
		_burn(tokenId);
	}

	/// @notice Overrides the default _burn functionality to ensure token managers are also removed.
	/// @dev Callers must have the necessary permissions.
	/// @param tokenId Token to burn.
	function _burn(uint256 tokenId) internal virtual override(ERC721, ERC721URIStorage) {
		isWriteableCheck();
		_onlyRegistryManagersAndTokenOwnersCheck(tokenId);
		tokenExistsCheck(tokenId);
		_removeTokenManagers(tokenId);
		super._burn(tokenId);
	}

	/// @notice Remove any token managers associated with the token. The amount of has used will
	/// depend directly on the number of token managers. Alternatively remove token managers
	/// individually before burning.
	/// @dev Can run out of gas if many token managers.
	/// @param tokenId Token to burn.
	function _removeTokenManagers(uint256 tokenId) internal {
		if (_tokenManagers[tokenId].length() > 0) {
			address[] memory tokenManagers = _tokenManagers[tokenId].values();
			// TODO: should a limit be imposed on the number of possible token managers?
			for (uint256 i = 0; i < tokenManagers.length; i++) {
				_tokenManagers[tokenId].remove(tokenManagers[i]);
				emit TokenManagerUpdate(tokenManagers[i], msg.sender, tokenId, ChangeType.Revoke);
			}
		}
	}

	/// @dev Just forwards the call to tokenURI.
	/// @inheritdoc	IMDRTCore
	function dataURI(uint256 tokenId) external view returns (string memory) {
		return tokenURI(tokenId);
	}

	/// @inheritdoc	IERC721Metadata
	function tokenURI(uint256 tokenId)
		public
		view
		virtual
		override(ERC721, ERC721URIStorage, IMDRTCore)
		returns (string memory)
	{
		isReadableCheck();
		return super.tokenURI(tokenId);
	}

	/// @dev Emits a TokenURIUpdate event.
	/// @inheritdoc	ERC721URIStorage
	function _setTokenURI(uint256 tokenId, string memory _tokenURI)
		internal
		virtual
		override(ERC721URIStorage)
		tokenExists(tokenId)
	{
		super._setTokenURI(tokenId, _tokenURI);

		emit TokenURIUpdate(msg.sender, tokenId, _tokenURI, 0);
	}

	/// @dev Caller must have necessary permissions.
	/// @inheritdoc	IMDRTCore
	function updateDataURI(uint256 tokenId, string calldata metadataURI) public {
		isWriteableCheck();
		tokenExistsCheck(tokenId);
		_onlyTokenManagersCheck(tokenId);
		_setTokenURI(tokenId, metadataURI);
	}

	/// @dev Just forwards call to updateDataURI.
	/// @inheritdoc	IMDRTCore
	function setTokenURI(uint256 tokenId, string calldata _tokenURI) external {
		updateDataURI(tokenId, _tokenURI);
	}

	/// @dev Checks whether sender is the contract/registry owner.
	/// @return True if msg.sender is the owner.
	function isOwner() internal view returns (bool) {
		return owner() == msg.sender;
	}

	/// @dev invokes the onlyOwner modifier via a function call.
	function onlyOwnerCheck() internal view onlyOwner {}

	/// @dev Caller must have necessary permissions.
	/// @param tokenId the tokenId for which the sender must be the owner.
	function isTokenOwner(uint256 tokenId) internal view virtual returns (bool) {
		isReadableCheck();
		tokenExistsCheck(tokenId);

		return ownerOf(tokenId) == msg.sender;
	}

	/// @dev Caller must have the required permissions.
	/// @inheritdoc	IMDRTCore
	function grant(
		Roles role,
		address account,
		uint256 tokenId
	) external virtual {
		isValidAddressCheck(account);
		isWriteableCheck();
		if (role == Roles.REGISTRY_MANAGER) {
			_onlyRegistryManagersCheck();
			_registryManagers.add(account);
			emit RegistryManagerUpdate(account, msg.sender, ChangeType.Grant);
			return;
		}
		if (role == Roles.TOKEN_CREATOR) {
			_onlyRegistryManagersCheck();
			_tokenCreators.add(account);
			// note: Adding a token creator intentionally does not emit an
			// event. If required can be added
			return;
		}
		if (role == Roles.TOKEN_MANAGER) {
			tokenExistsCheck(tokenId);
			_onlyTokenManagersCheck(tokenId);
			_tokenManagers[tokenId].add(account);
			emit TokenManagerUpdate(account, msg.sender, tokenId, ChangeType.Grant);
			return;
		}
	}

	/// @dev Caller must have the required permissions.
	/// @inheritdoc	IMDRTCore
	function revoke(
		Roles role,
		address account,
		uint256 tokenId
	) external virtual {
		isValidAddressCheck(account);
		isWriteableCheck();
		if (role == Roles.REGISTRY_MANAGER) {
			_onlyRegistryManagersCheck();
			_registryManagers.remove(account);
			emit RegistryManagerUpdate(account, msg.sender, ChangeType.Revoke);
			return;
		}
		if (role == Roles.TOKEN_CREATOR) {
			_onlyRegistryManagersCheck();
			_tokenCreators.remove(account);
			// note: Removing a token creator intentionally does not emit an
			// event. If required can be added
			return;
		}
		if (role == Roles.TOKEN_MANAGER) {
			tokenExistsCheck(tokenId);
			_onlyTokenManagersCheck(tokenId);
			_tokenManagers[tokenId].remove(account);
			emit TokenManagerUpdate(account, msg.sender, tokenId, ChangeType.Revoke);
			return;
		}
	}

	/// @dev Caller must have the required permissions.
	/// @inheritdoc	IMDRTCore
	function hasRole(
		Roles role,
		address account,
		uint256 tokenId
	) public view virtual returns (bool) {
		isNotHaltedCheck();
		if (role == Roles.REGISTRY_MANAGER) {
			return _registryManagers.contains(account);
		}
		if (role == Roles.TOKEN_CREATOR) {
			return _tokenCreators.contains(account);
		}
		if (role == Roles.TOKEN_MANAGER) {
			tokenExistsCheck(tokenId);
			return _tokenManagers[tokenId].contains(account);
		}
		return false;
	}

	/// @notice Get the number of accounts with the role specified.
	/// @param role The role to be checked.
	/// @param tokenId The applicable token (if relevant - otherwise use zero for
	/// the token Id)
	function roleCount(Roles role, uint256 tokenId) public view virtual returns (uint256) {
		isReadableCheck();
		if (role == Roles.REGISTRY_MANAGER) {
			_onlyRegistryManagersCheck();
			return _registryManagers.length();
		}
		if (role == Roles.TOKEN_CREATOR) {
			_onlyRegistryManagersCheck();
			return _tokenCreators.length();
		}
		if (role == Roles.TOKEN_MANAGER) {
			tokenExistsCheck(tokenId);
			_onlyTokenManagersCheck(tokenId);
			return _tokenManagers[tokenId].length();
		}
		return 0;
	}

	/// @notice Return the manager address at the index specified.
	/// @dev Call Enumerable set ```at``` function. Ordering not guaranteed.
	/// @param role The manager role to query.
	/// @param index The index of the manager to return.
	/// @param tokenId The tokenId for the manager (use 0 if not applicable)
	/// @return The manager address at the index.
	function managerAt(
		Roles role,
		uint256 index,
		uint256 tokenId
	) public view returns (address) {
		isReadableCheck();
		if (role == Roles.REGISTRY_MANAGER) {
			_onlyRegistryManagersCheck();
			return _registryManagers.at(index);
		}
		if (role == Roles.TOKEN_MANAGER) {
			tokenExistsCheck(tokenId);
			_onlyTokenManagersCheck(tokenId);
			return _tokenManagers[tokenId].at(index);
		}
		revert("role not found");
	}

	/// @notice Returns the number of accounts that have token manager permissions for a specific token.
	/// @dev This version of the function can only be invoked by the registry owner and bypasses
	/// checking whether the token actually exists and doesn't need to check for whether being invoked by
	/// a token manager.
	/// @param tokenId the applicable token
	/// @return the total number of accounts assigned to the role.
	function getTokenManagerCountForOwner(uint256 tokenId) public view returns (uint256) {
		// TODO: Is there a better name for this function?
		// TODO: Either remove this or add the other enumerable functions.
		isReadableCheck();
		onlyOwnerCheck();
		return _tokenManagers[tokenId].length();
	}

	/// @dev Check whether an address is valid.
	function isValidAddressCheck(address addr) internal pure {
		require(addr != address(0), "invalid address");
	}

	/// @dev Check whether a token has been minted and available.
	function tokenExistsCheck(uint256 tokenId) internal view {
		// require(_exists(tokenId), "t! must exist");
		require(_exists(tokenId), "ERC721: owner query for nonexistent token");
	}

	/// @dev Check whether a token has been minted and available.
	modifier tokenExists(uint256 tokenId) {
		tokenExistsCheck(tokenId);
		_;
	}

	/// @dev Check whether an account has Registry Manager permissions.
	function _onlyRegistryManagersCheck() internal view {
		require(isOwner() || hasRole(Roles.REGISTRY_MANAGER, msg.sender, 0), "must be registry manager");
	}

	/// @dev Check whether an account is Registry Manager or token owner.
	function _onlyRegistryManagersAndTokenOwnersCheck(uint256 tokenId) internal view {
		tokenExistsCheck(tokenId);
		require(
			isOwner() || isTokenOwner(tokenId) || hasRole(Roles.REGISTRY_MANAGER, msg.sender, 0),
			"must be owner or registry manager"
		);
	}

	/// @dev Check whether an account has Token Manager permissions.
	function _onlyTokenManagersCheck(uint256 tokenId) internal view {
		require(_exists(tokenId), "t! must exist");
		require(
			isOwner() ||
				isTokenOwner(tokenId) ||
				hasRole(Roles.REGISTRY_MANAGER, msg.sender, 0) ||
				hasRole(Roles.TOKEN_MANAGER, msg.sender, tokenId),
			"must be token manager"
		);
	}

	/// @dev Check whether an account has Token Creator permissions.
	function _onlyTokenCreatorsCheck() internal view {
		require(
			isOwner() || hasRole(Roles.REGISTRY_MANAGER, msg.sender, 0) || hasRole(Roles.TOKEN_CREATOR, msg.sender, 0),
			"must be creator"
		);
	}

	/// @inheritdoc	IMDRTRunState
	function setRunningState(uint8) public virtual {}

	/// @inheritdoc	IMDRTRunState
	function getRunningState() public view virtual returns (uint8) {}

	/// @inheritdoc	IMDRTRunState
	function isNotHaltedCheck() public view virtual {}

	/// @inheritdoc	IMDRTRunState
	function isReadableCheck() public view virtual {}

	/// @inheritdoc	IMDRTRunState
	function isWriteableCheck() public view virtual {}
}
