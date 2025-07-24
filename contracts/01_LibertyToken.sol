// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

contract LibertyToken is ERC20, Ownable2Step {
    constructor() 
        ERC20("Liberty", "LIB") 
        Ownable(msg.sender)
    {
        _mint(msg.sender, 10_000_000 * 10 ** decimals()); // 10 M
    }

    /* Mint more for rewards (onlyOwner) */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}