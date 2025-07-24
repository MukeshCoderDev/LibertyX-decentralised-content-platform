// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "./01_LibertyToken.sol";

contract LibertyDAO is Ownable2Step {
    LibertyToken public immutable token;
    
    struct Proposal {
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 endTime;
        bool executed;
        mapping(address => bool) hasVoted;
    }
    
    mapping(uint256 => Proposal) public proposals;
    uint256 public nextProposalId = 1;
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant QUORUM = 500_000 * 10 ** 18; // 500k LIB
    
    event ProposalCreated(uint256 indexed proposalId, string description);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);
    event FundsReceived(address indexed from, uint256 amount);
    
    constructor(LibertyToken _token) Ownable(msg.sender) {
        token = _token;
    }
    
    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }
    
    function createProposal(string calldata description) external returns (uint256) {
        require(token.balanceOf(msg.sender) >= 1000 * 10 ** 18, "Need 1000 LIB to propose");
        
        uint256 proposalId = nextProposalId++;
        Proposal storage proposal = proposals[proposalId];
        proposal.description = description;
        proposal.endTime = block.timestamp + VOTING_PERIOD;
        
        emit ProposalCreated(proposalId, description);
        return proposalId;
    }
    
    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp < proposal.endTime, "Voting ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        
        uint256 weight = token.balanceOf(msg.sender);
        require(weight > 0, "No voting power");
        
        proposal.hasVoted[msg.sender] = true;
        
        if (support) {
            proposal.votesFor += weight;
        } else {
            proposal.votesAgainst += weight;
        }
        
        emit VoteCast(proposalId, msg.sender, support, weight);
    }
    
    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.endTime, "Voting not ended");
        require(!proposal.executed, "Already executed");
        require(proposal.votesFor > proposal.votesAgainst, "Proposal failed");
        require(proposal.votesFor >= QUORUM, "Quorum not reached");
        
        proposal.executed = true;
        emit ProposalExecuted(proposalId);
    }
}