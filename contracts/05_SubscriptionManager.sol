// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SubscriptionManager is ReentrancyGuard {
    struct Plan {
        uint256 priceWei;
        uint256 duration; // seconds
    }

    struct Sub {
        uint256 expiresAt;
    }

    mapping(address => Plan) public plans;
    mapping(address => mapping(address => Sub)) public subs;

    event PlanSet(address indexed creator, uint256 priceWei, uint256 duration);
    event Subscribed(address indexed creator, address indexed fan, uint256 expiresAt);

    function setPlan(uint256 _priceWei, uint256 _duration) external {
        plans[msg.sender] = Plan(_priceWei, _duration);
        emit PlanSet(msg.sender, _priceWei, _duration);
    }

    function subscribe(address _creator) external payable nonReentrant {
        Plan memory p = plans[_creator];
        require(p.priceWei > 0, "no plan");
        require(msg.value == p.priceWei, "wrong amount");

        uint256 newExpiry = (subs[_creator][msg.sender].expiresAt > block.timestamp
            ? subs[_creator][msg.sender].expiresAt
            : block.timestamp) + p.duration;

        subs[_creator][msg.sender].expiresAt = newExpiry;
        payable(_creator).transfer(msg.value);

        emit Subscribed(_creator, msg.sender, newExpiry);
    }

    function isSubscribed(address _creator, address _fan) external view returns (bool) {
        return subs[_creator][_fan].expiresAt > block.timestamp;
    }
}