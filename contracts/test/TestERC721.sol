// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract TestERC721 is ERC721URIStorage, Ownable {
  using Counters for Counters.Counter;
  Counters.Counter private currentTokenId;
  event Burn(address indexed sender, uint256 tokenId);

  constructor() ERC721("Test721", "TEST721") {}

  function mint(address to, string memory _tokenURI) public onlyOwner returns (uint256 tokenId) {
    currentTokenId.increment();
    uint256 newItemId = currentTokenId.current();
    _safeMint(to, newItemId);
    _setTokenURI(newItemId, _tokenURI);
    return newItemId;
  }

  function batchMint(
    address to,
    string memory _tokenURI,
    uint256 size
  ) public onlyOwner returns (uint256[] memory tokenIds) {
    require(size != 0, "size must be granter than zero");
    tokenIds = new uint256[](size);
    for (uint256 i = 0; i < size; ++i) {
      tokenIds[i] = mint(to, _tokenURI);
    }
  }

  function burn(uint256 tokenId) public {
    require(_isApprovedOrOwner(_msgSender(), tokenId), "caller is not owner nor approved");
    _burn(tokenId);
    emit Burn(_msgSender(), tokenId);
  }
}
