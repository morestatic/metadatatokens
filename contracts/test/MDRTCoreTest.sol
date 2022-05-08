// contracts/MetadataRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "../MDRTCore.sol";
import "../IMDRTRunState.sol";

contract MDRTCoreTest is ERC721, ERC721URIStorage, Ownable, MDRTCore {
	using SafeMath for uint256;
	using Counters for Counters.Counter;
	using EnumerableSet for EnumerableSet.AddressSet;

	constructor(string memory name, string memory symbol) MDRTCore(name, symbol) {}

	function supportsInterface(bytes4 interfaceId) public view override(ERC721, MDRTCore) returns (bool) {
		return super.supportsInterface(interfaceId);
	}

	function _beforeTokenTransfer(
		address from,
		address to,
		uint256 tokenId
	) internal virtual override(ERC721, MDRTCore) {
		super._beforeTokenTransfer(from, to, tokenId);
	}

	function mint(address to, uint256 tokenId) public {
		isWriteableCheck();
		_onlyTokenCreatorsCheck();

		_safeMint(to, tokenId);
	}

	function safeMint(address to, uint256 tokenId) public {
		_safeMint(to, tokenId);
	}

	function safeMint(
		address to,
		uint256 tokenId,
		bytes memory _data
	) public {
		_safeMint(to, tokenId, _data);
	}

	/**
	 * @dev _burn is called when burning a token.
	 */
	function _burn(uint256 tokenId) internal virtual override(ERC721, ERC721URIStorage, MDRTCore) {
		super._burn(tokenId);
	}

	/**
	 * @dev tokenURI returns the token uri associated with the token.
	 */
	function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage, MDRTCore) returns (string memory) {
		return super.tokenURI(tokenId);
	}

	/**
	 * @dev _setTokenURI is an internal function to set a token URI.
	 */
	function _setTokenURI(uint256 tokenId, string memory _tokenURI)
		internal
		virtual
		override(ERC721URIStorage, MDRTCore)
		tokenExists(tokenId)
	{
		super._setTokenURI(tokenId, _tokenURI);
	}
}
