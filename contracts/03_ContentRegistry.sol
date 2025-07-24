// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./02_CreatorRegistry.sol";
import "./05_SubscriptionManager.sol";
import "./06_NFTAccess.sol";

contract ContentRegistry {
    enum Access { PUBLIC, SUBSCRIBERS, NFT_TIER }

    struct Content {
        address creator;
        string arTxId;          // Arweave tx
        uint256 priceWei;       // 0 for free
        Access access;
        uint256 nftTierId;      // if NFT_TIER
        uint256 createdAt;
    }

    uint256 public nextId = 1;
    mapping(uint256 => Content) public contents;

    CreatorRegistry public immutable CREATOR_REG;
    SubscriptionManager public immutable SUB_MGR;
    NFTAccess public immutable NFT_ACCESS;

    event Uploaded(uint256 indexed id, address indexed creator, string arTxId, uint256 price, Access access);

    constructor(address _cr, address _sm, address _nft) {
        CREATOR_REG = CreatorRegistry(_cr);
        SUB_MGR = SubscriptionManager(_sm);
        NFT_ACCESS = NFTAccess(_nft);
    }

    function upload(
        string calldata _arTxId,
        uint256 _priceWei,
        Access _access,
        uint256 _tierId
    ) external returns (uint256 id) {
        (string memory handle,,,,,) = CREATOR_REG.creators(msg.sender);
        require(bytes(handle).length != 0, "!creator");
        
        id = nextId++;
        contents[id] = Content(msg.sender, _arTxId, _priceWei, _access, _tierId, block.timestamp);
        
        emit Uploaded(id, msg.sender, _arTxId, _priceWei, _access);
    }

    /* view helpers */
    function hasAccess(uint256 _id, address _user) external view returns (bool) {
        Content memory c = contents[_id];
        
        if (c.access == Access.PUBLIC) return true;
        if (c.access == Access.SUBSCRIBERS) return SUB_MGR.isSubscribed(c.creator, _user);
        if (c.access == Access.NFT_TIER) return NFT_ACCESS.balanceOf(_user, c.nftTierId) > 0;
        
        return false;
    }
}