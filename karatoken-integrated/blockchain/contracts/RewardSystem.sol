// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./KRTToken.sol";

/**
 * @title Karatoken Reward System
 * @dev Handles performance rewards, streaks, and bonuses
 */
contract RewardSystem is Ownable {
    KRTToken public krtToken;
    
    // Reward tiers
    struct RewardTier {
        uint256 minScore;
        uint256 maxScore;
        uint256 multiplier;
        string name;
    }
    
    RewardTier[] public rewardTiers;
    
    // User data
    struct UserData {
        uint256 totalEarnings;
        uint256 currentStreak;
        uint256 lastActivity;
        uint256 totalPerformances;
        uint256 battlesWon;
        uint256 tournamentsWon;
    }
    
    mapping(address => UserData) public userData;
    
    // Constants
    uint256 public constant BASE_REWARD = 5 * 10**18; // 5 KRT
    uint256 public constant STREAK_BONUS = 1 * 10**18; // 1 KRT per day
    uint256 public constant MAX_STREAK_BONUS = 7 * 10**18; // Max 7 KRT streak bonus
    uint256 public constant BATTLE_WIN_BONUS = 10 * 10**18; // 10 KRT for battle win
    uint256 public constant TOURNAMENT_WIN_BONUS = 50 * 10**18; // 50 KRT for tournament win
    
    // Events
    event PerformanceRewarded(address indexed user, uint256 score, uint256 reward, string tier);
    event StreakUpdated(address indexed user, uint256 streak);
    event BattleWon(address indexed user, uint256 reward);
    event TournamentWon(address indexed user, uint256 reward);
    
    constructor(address _krtToken) {
        krtToken = KRTToken(_krtToken);
        
        // Initialize reward tiers
        rewardTiers.push(RewardTier(90, 100, 200, "Gold")); // 2x multiplier
        rewardTiers.push(RewardTier(70, 89, 100, "Silver")); // 1x multiplier
        rewardTiers.push(RewardTier(50, 69, 50, "Bronze")); // 0.5x multiplier
        rewardTiers.push(RewardTier(0, 49, 0, "Fail")); // No reward
    }
    
    /**
     * @dev Reward user for performance
     */
    function rewardPerformance(address user, uint256 score, string memory reason) external onlyOwner {
        require(user != address(0), "Invalid user address");
        require(score <= 100, "Score must be 0-100");
        
        // Calculate base reward
        uint256 baseReward = BASE_REWARD;
        
        // Apply tier multiplier
        for (uint i = 0; i < rewardTiers.length; i++) {
            if (score >= rewardTiers[i].minScore && score <= rewardTiers[i].maxScore) {
                baseReward = (baseReward * rewardTiers[i].multiplier) / 100;
                break;
            }
        }
        
        // Apply streak bonus
        uint256 streakBonus = calculateStreakBonus(user);
        uint256 totalReward = baseReward + streakBonus;
        
        // Update user data
        userData[user].totalEarnings += totalReward;
        userData[user].totalPerformances += 1;
        userData[user].lastActivity = block.timestamp;
        
        // Award tokens
        krtToken.earnReward(user, totalReward, reason);
        
        emit PerformanceRewarded(user, score, totalReward, getTierName(score));
    }
    
    /**
     * @dev Update user streak
     */
    function updateStreak(address user) external onlyOwner {
        uint256 currentTime = block.timestamp;
        uint256 lastActivity = userData[user].lastActivity;
        
        // Check if activity is within 24 hours
        if (currentTime - lastActivity <= 1 days) {
            userData[user].currentStreak += 1;
        } else {
            userData[user].currentStreak = 1;
        }
        
        emit StreakUpdated(user, userData[user].currentStreak);
    }
    
    /**
     * @dev Reward battle win
     */
    function rewardBattleWin(address user) external onlyOwner {
        require(user != address(0), "Invalid user address");
        
        userData[user].battlesWon += 1;
        userData[user].totalEarnings += BATTLE_WIN_BONUS;
        
        krtToken.earnReward(user, BATTLE_WIN_BONUS, "Battle Win");
        
        emit BattleWon(user, BATTLE_WIN_BONUS);
    }
    
    /**
     * @dev Reward tournament win
     */
    function rewardTournamentWin(address user) external onlyOwner {
        require(user != address(0), "Invalid user address");
        
        userData[user].tournamentsWon += 1;
        userData[user].totalEarnings += TOURNAMENT_WIN_BONUS;
        
        krtToken.earnReward(user, TOURNAMENT_WIN_BONUS, "Tournament Win");
        
        emit TournamentWon(user, TOURNAMENT_WIN_BONUS);
    }
    
    /**
     * @dev Calculate streak bonus
     */
    function calculateStreakBonus(address user) internal view returns (uint256) {
        uint256 streak = userData[user].currentStreak;
        if (streak == 0) return 0;
        
        uint256 bonus = STREAK_BONUS * streak;
        return bonus > MAX_STREAK_BONUS ? MAX_STREAK_BONUS : bonus;
    }
    
    /**
     * @dev Get tier name for score
     */
    function getTierName(uint256 score) internal view returns (string memory) {
        for (uint i = 0; i < rewardTiers.length; i++) {
            if (score >= rewardTiers[i].minScore && score <= rewardTiers[i].maxScore) {
                return rewardTiers[i].name;
            }
        }
        return "Unknown";
    }
    
    /**
     * @dev Get user statistics
     */
    function getUserStats(address user) external view returns (
        uint256 totalEarnings,
        uint256 currentStreak,
        uint256 totalPerformances,
        uint256 battlesWon,
        uint256 tournamentsWon
    ) {
        UserData memory data = userData[user];
        return (
            data.totalEarnings,
            data.currentStreak,
            data.totalPerformances,
            data.battlesWon,
            data.tournamentsWon
        );
    }
    
    /**
     * @dev Get pending rewards for user
     */
    function getPendingRewards(address user) external view returns (uint256) {
        return krtToken.getPendingRewards(user);
    }
} 