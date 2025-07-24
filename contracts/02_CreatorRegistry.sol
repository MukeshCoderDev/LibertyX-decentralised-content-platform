// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable2Step.sol";

contract CreatorRegistry is Ownable2Step {
    constructor() Ownable(msg.sender) {}
    struct Creator {
        string handle;
        string avatarURI;   // IPFS / Arweave
        string bio;
        bool kycVerified;
        bool isBanned;
        uint256 earned;     // wei
    }

    mapping(address => Creator) public creators;
    mapping(string => address) public handleToAddress;

    event Registered(address indexed creator, string handle);
    event Updated(address indexed creator);
    event KycUpdated(address indexed creator, bool verified);
    event EarningsIncreased(address indexed creator, uint256 amount);

    function register(string calldata _handle, string calldata _avatar, string calldata _bio) external {
        require(bytes(_handle).length > 0, "empty handle");
        require(handleToAddress[_handle] == address(0), "taken");
        
        creators[msg.sender] = Creator(_handle, _avatar, _bio, false, false, 0);
        handleToAddress[_handle] = msg.sender;
        
        emit Registered(msg.sender, _handle);
    }

    function updateProfile(string calldata _avatar, string calldata _bio) external {
        Creator storage c = creators[msg.sender];
        require(bytes(c.handle).length != 0, "!creator");
        
        c.avatarURI = _avatar;
        c.bio = _bio;
        
        emit Updated(msg.sender);
    }

    /* onlyOwner (DAO / Admin) */
    function setKyc(address _creator, bool _status) external onlyOwner {
        creators[_creator].kycVerified = _status;
        emit KycUpdated(_creator, _status);
    }

    function addEarnings(address _creator, uint256 _amount) external onlyOwner {
        creators[_creator].earned += _amount;
        emit EarningsIncreased(_creator, _amount);
    }
}