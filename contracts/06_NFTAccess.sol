// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

contract NFTAccess is ERC1155URIStorage, Ownable2Step {
    uint256 public nextId = 1;
    mapping(uint256 => address) public creatorOf;

    event TierCreated(uint256 indexed id, address indexed creator, string uri, uint256 maxSupply, uint256 price);
    event Minted(uint256 indexed id, address indexed buyer, uint256 amount);

    constructor() ERC1155("") Ownable(msg.sender) {}

    function createTier(
        string calldata _uri,
        uint256 _maxSupply,
        uint256 _priceWei
    ) external returns (uint256 id) {
        id = nextId++;
        creatorOf[id] = msg.sender;
        _setURI(id, _uri);
        
        emit TierCreated(id, msg.sender, _uri, _maxSupply, _priceWei);
    }

    function mint(uint256 _id, uint256 _amount) external payable {
        require(creatorOf[_id] != address(0), "!exists");
        
        /* Optional supply check & price handled on front-end or extend here */
        _mint(msg.sender, _id, _amount, "");
        
        emit Minted(_id, msg.sender, _amount);
    }
}