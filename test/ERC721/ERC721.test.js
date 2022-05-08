const {
  shouldBehaveLikeERC721,
  shouldBehaveLikeERC721Metadata,
} = require('./ERC721.behavior');

const ERC721Mock = artifacts.require('MDRTCoreTest');

contract('MDRTCore', function (accounts) {
  const name = 'Non Fungible Token';
  const symbol = 'NFT';

  beforeEach(async function () {
    this.token = await ERC721Mock.new(name, symbol);
  });

  shouldBehaveLikeERC721('MDRTCore', ...accounts);
  shouldBehaveLikeERC721Metadata('MDRTCore', name, symbol, ...accounts);
});
