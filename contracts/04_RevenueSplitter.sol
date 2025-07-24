// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RevenueSplitter {
    uint256 public constant PLATFORM_FEE = 1000; // 10% (basis points)
    address public immutable DAO_TREASURY;

    event Split(address indexed payer, address indexed creator, uint256 total, uint256 creatorShare, uint256 fee);

    constructor(address _treasury) {
        DAO_TREASURY = _treasury;
    }

    receive() external payable {
        revert("use split()");
    }

    function split(address _creator) external payable {
        require(msg.value > 0, "zero");
        
        uint256 fee = (msg.value * PLATFORM_FEE) / 10000;
        uint256 creatorShare = msg.value - fee;

        /* send instantly */
        payable(_creator).transfer(creatorShare);
        payable(DAO_TREASURY).transfer(fee);

        emit Split(msg.sender, _creator, msg.value, creatorShare, fee);
    }
}