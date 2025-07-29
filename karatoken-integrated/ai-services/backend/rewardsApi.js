const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();

const rewardsConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'karatoken_rewards_backend.json'), 'utf8')
);
const rewardSystem = rewardsConfig.rewardSystem;

function getTier(score) {
  for (const [tier, info] of Object.entries(rewardSystem.aiScoringTiers)) {
    const [min, max] = info.range.split('-').map(Number);
    if (score >= min && score <= max) return { tier, ...info };
  }
  return { tier: 'fail', ...rewardSystem.aiScoringTiers.fail };
}

function getStreakBonus(streak) {
  if (!rewardSystem.engagementBonuses.dailyLoginStreak.enabled) return 0;
  const rewards = rewardSystem.engagementBonuses.dailyLoginStreak.rewards;
  return rewards[Math.min(streak, rewards.length) - 1] || 0;
}

router.post('/claim', (req, res) => {
  const { userId, score, streak = 1, context = {} } = req.body;
  if (typeof score !== 'number') return res.status(400).json({ error: 'Score required' });
  const tierInfo = getTier(score);
  let reward = rewardSystem.basePerformanceReward * tierInfo.multiplier;
  const streakBonus = getStreakBonus(streak);
  reward += streakBonus;
  reward = Math.min(reward, rewardSystem.maxPerformancePayout);
  let bonuses = {};
  if (context.referral) {
    reward += rewardSystem.engagementBonuses.referralBonus;
    bonuses.referral = rewardSystem.engagementBonuses.referralBonus;
  }
  if (context.challengeCompleted) {
    reward += rewardSystem.engagementBonuses.challengeCompletionBonus;
    bonuses.challenge = rewardSystem.engagementBonuses.challengeCompletionBonus;
  }
  if (context.livestreamShared) {
    reward += rewardSystem.engagementBonuses.livestreamShareBonus;
    bonuses.livestream = rewardSystem.engagementBonuses.livestreamShareBonus;
  }
  let luckBonus = 0;
  if (context.goldenNoteSpin) {
    const possible = rewardSystem.luckBasedBonuses.goldenNoteSpin.possibleRewards;
    luckBonus = possible[Math.floor(Math.random() * possible.length)];
    reward += typeof luckBonus === 'number' ? luckBonus : 0;
    bonuses.goldenNoteSpin = luckBonus;
  }
  let nftReward = null;
  if (tierInfo.tier === 'gold' && context.streak >= 7) {
    nftReward = rewardSystem.competitionRewards.badges[0];
  }
  reward = Math.floor(reward);
  res.json({
    userId,
    score,
    tier: tierInfo.tier,
    reward,
    currency: rewardSystem.currency,
    bonuses,
    streakBonus,
    nftReward,
    tierDescription: tierInfo.description,
    note: 'Integrate wallet crediting and NFT minting in production.'
  });
});

module.exports = router;
