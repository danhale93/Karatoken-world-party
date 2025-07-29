// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title KRT Token (Karatoken)
 * @dev ERC-20 token for the Karatoken music platform
 */
contract KRTToken is ERC20, Ownable, Pausable {
    // Token details
    uint256 public constant INITIAL_SUPPLY = 1000000000 * 10**18; // 1 billion KRT
    uint256 public constant REWARD_POOL = 200000000 * 10**18; // 200 million for rewards
    uint256 public constant TEAM_POOL = 100000000 * 10**18; // 100 million for team
    
    // Reward system
    mapping(address => uint256) public userRewards;
    mapping(address => uint256) public lastRewardClaim;
    uint256 public totalRewardsDistributed;
    
    // Events
    event RewardEarned(address indexed user, uint256 amount, string reason);
    event RewardClaimed(address indexed user, uint256 amount);
    event TokensPurchased(address indexed user, uint256 amount, uint256 cost);
    
    constructor() ERC20("Karatoken", "KRT") {
        _mint(msg.sender, INITIAL_SUPPLY);
        
        // Allocate initial pools
        _transfer(msg.sender, address(this), REWARD_POOL);
        _transfer(msg.sender, owner(), TEAM_POOL);
    }
    
    /**
     * @dev Earn rewards for platform activities
     */
    function earnReward(address user, uint256 amount, string memory reason) external onlyOwner {
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(address(this)) >= amount, "Insufficient reward pool");
        
        userRewards[user] += amount;
        totalRewardsDistributed += amount;
        
        emit RewardEarned(user, amount, reason);
    }
    
    /**
     * @dev Claim accumulated rewards
     */
    function claimRewards() external {
        uint256 rewardAmount = userRewards[msg.sender];
        require(rewardAmount > 0, "No rewards to claim");
        
        userRewards[msg.sender] = 0;
        lastRewardClaim[msg.sender] = block.timestamp;
        
        _transfer(address(this), msg.sender, rewardAmount);
        
        emit RewardClaimed(msg.sender, rewardAmount);
    }
    
    /**
     * @dev Get user's pending rewards
     */
    function getPendingRewards(address user) external view returns (uint256) {
        return userRewards[user];
    }
    
    /**
     * @dev Purchase tokens (for demo purposes)
     */
    function purchaseTokens() external payable {
        require(msg.value > 0, "Must send ETH to purchase tokens");
        
        // Simple conversion: 1 ETH = 1000 KRT
        uint256 tokenAmount = msg.value * 1000;
        
        require(balanceOf(owner()) >= tokenAmount, "Insufficient token supply");
        
        _transfer(owner(), msg.sender, tokenAmount);
        
        emit TokensPurchased(msg.sender, tokenAmount, msg.value);
    }
    
    /**
     * @dev Emergency pause
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Withdraw ETH from contract
     */
    function withdrawETH() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    /**
     * @dev Override transfer to check pause
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        require(!paused(), "Token transfer paused");
    }
} 