const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const config = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'karatoken_rewards_backend.json'), 'utf8')
);
const royaltySystem = config.royaltySystem;

// Track Registration
router.post('/register-track', (req, res) => {
  const { title, artist, composer, publisher, rightsHolderAddress } = req.body;
  const required = royaltySystem.trackRegistration.requiredFields;
  for (const field of required) {
    if (!req.body[field]) {
      return res.status(400).json({ error: `Missing field: ${field}` });
    }
  }
  // TODO: Save to DB and verify (manual or blockchain)
  res.json({ status: 'registered', verification: royaltySystem.trackRegistration.verification });
});

// Royalty Payout Calculation
router.post('/calculate-royalty', (req, res) => {
  const { type, plays, minutes, audience, isCover } = req.body;
  let payout = 0;
  if (type === 'streaming') {
    payout = plays * royaltySystem.payoutRules.streaming.perPlayValue;
  } else if (type === 'download') {
    payout = royaltySystem.payoutRules.download.fixedRoyalty;
  } else if (type === 'livePerformance') {
    payout = minutes * royaltySystem.payoutRules.livePerformance.perMinute;
    if (royaltySystem.payoutRules.livePerformance.audienceMultiplier && audience) {
      payout *= audience;
    }
  }
  if (isCover) {
    payout = {
      originalRightsHolder: payout * royaltySystem.payoutRules.coverPerformance.split.originalRightsHolder,
      performer: payout * royaltySystem.payoutRules.coverPerformance.split.performer
    };
  }
  res.json({ payout, currency: royaltySystem.currency });
});

// Vault Unlock
router.post('/unlock-vault', (req, res) => {
  const { userId, streakDays } = req.body;
  const unlockAfter = royaltySystem.luckBasedBonuses.mysteryVault.unlockAfter;
  if (streakDays < unlockAfter) {
    return res.status(400).json({ error: `Need ${unlockAfter} day streak to unlock vault.` });
  }
  const [min, max] = royaltySystem.luckBasedBonuses.mysteryVault.bonusRange;
  const bonus = Math.floor(Math.random() * (max - min + 1)) + min;
  // TODO: Credit bonus to user wallet
  res.json({ bonus, currency: royaltySystem.currency, note: 'Vault unlocked!' });
});

module.exports = router;
