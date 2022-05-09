# METADATA REFERENCE TOKENS

## Introduction

This contract is a proof of concept and prototype based on the idea of a
Metadata Reference Token (MDRT). A Metadata Reference Token is a full ERC721
token (see challenges and issues section) that focuses solely on the tokenURI
element of an NFT, rather than the transactional and ownership aspects.

The primary use case is to allow metadata to include stable references
(important when immutable content addressed metadata is being used) to further
metadata.

A classic example is where a Music NFT references metadata regarding the Music
NFT itself but then that metadata also includes references to other entities
such as Artists, Labels or Recordings.

The Metadata Reference Token allows those other references to be on-chain
entities that can be managed and updated independently of the referencing
metadata (e.g. the core Music NFT). Updates both in terms of the management
and any changes to actual reference are logged on-chain so there's a history
if and when changes are made.

In the music example, it is understood that artist, label and recording info
that relates directly to the NFT "product" should be directly included
related NFT product info, so the references tokens are best suited to info
that isn't considered part of the product itself (e.g. extended artist or
label info). Note this is just one example and MRDTs might be useful in
others domains such as Art NFTs.

Note that the form of a reference to an MDRT is to be determined and is
arguebly outside of scope. The reference can actually be any format that
correctly identifies the specific chain, smart contract and token.

A good example is the Ceramic Asset ID specification ([CAIP-19](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-19.md)).

e.g. `eip155:1/erc721:0x06012c8cf97BEaD5deAe237070F9587f8E7A266d/771769`

## Features

This implementation adds three further capabilities on top of basic access to
an on-chain URL. These are described below.

### Admin Roles

Firstly there are two extra admin roles in addition to the core ERC721 roles.
These are for Registry (aka contract) and Token Managers.

Registry Managers have full control of all aspects of the contract apart from
they cannot `halt` the contract - which can only be done by the contract /
registry owner. Additionally, they do not have transfer, approval or other
specific ERC721 admin features.

Token Managers are additional accounts that can update the TokenURI and
related RefSpec (see below) on-behalf of the Token Owner. As with Registry
Managers, Token Managers have no ERC721 specific admin rights.

### Extra Meta

Secondly, there's support for an additional URI property for a field
containing a RefSpec. This field allows further metadata that describes how
to access the token metadata (extra meta!). For example, this could be a link
to json schema describing the metadata and/or public keys, or both for
verification etc.

### Additional Contract Run States

Finally, the contract can be halted, paused or made read-only, in addition
to the regular running behaviour.

## Existing ERC721 Functionality

All existing ERC721 functionality is continued and ERC721 roles (such as
approvers etc) still exist and the related functionality isn't not impacted
by the the additional roles provided as part of the MDRT implementation.

## Implementation

The Admin Roles are built-in to the default implementation and modifications
require changing the contract implementation.

The RefSpec is added via an inheritance interface and corresponding
implementation built on top of the base contract.

While the Run States interface is implemented by the core contract it is a
null implementation and doesn't do anything. To use the additional states,
the version of the contract that uses the run state implementation should be
used.

## Testing

The tests include full coverage, including a full port of the ERC721 OZ
behaviour tests.

## Challenges and Issues

### Security

No audit or similar has been completed. This is pure v0.1 functionality. Use
at your own risk.

### Performance & Cost

Clearly NFT contracts and metadata containing multiple references and
requiring subsequent lookups are going to be expensive in a ETH mainnet
world. This cost has to be balanced against the benefits resulting from
de-coupling some of the info elements necessary in the context of an NFT
product release.

### Early Days

As mentioned in the intro, this implementation is purely a prototype and proof
of concept.

### ERC721 Support

It isn't particularly clear that making MDRTs a tradable ERC721 token is a
desirable property. However, this is where the implementation started from,
so the functionality has been kept for now. Based on feedback it may be
removed.

## Credits

The original genesis of the idea for Metadata Reference Tokens (MDRTs) was the
Data Tokens of the Ocean Protocol [OceanProtocol](https://oceanprotocol.com/)
and the work of Trent McConaghy [@trentmc0](https://twitter.com/trentmc0).
However MDRTs are much more basic.

Also conversations related to Web3 Music on the [Nina](https://www.ninaprotocol.com/)
and [Catalog](https://beta.catalog.works/) discords have
been helpful, although the concept itself wasn't discussed explicitly with
the communities there.

## Outstanding

- [ ] Should a change of contract owner reset the registry managers? (probably not)
- [ ] Should transferring a token reset the tokenManagers? (probably not)
- [ ] Should tokenManagers be able to manage other tokenManagers? (probably not)
- [ ] Add github CI support
- [ ] Consider using foundary where appropriate
- [ ] Review natspec documentation
- [ ] Improve this documentation
- [ ] Tidy and refactor tests
- [ ] Tidy up some folders (e.g. contracts/test)
- [ ] Consider the handling of the test minting functions for the ERC721 tests
- [ ] Add constructor based limits on the number of admins? (probably)
- [ ] Add an explicit interface for the roles based functions, even if
      implemented in the core contract?
- [ ] Can roles be more configurable?
- [ ] How about multi-sig for registry admins?
- [ ] Consider extending the ERC165 functionality for the MDRT interfaces
- [ ] Add samples and dev guide
- [ ] Add simple client to create, get and update the tokens
- [ ] Add simple client to manage admins and run states
