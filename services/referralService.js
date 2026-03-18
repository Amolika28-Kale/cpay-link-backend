

// services/referralService.js - SIMPLIFIED VERSION
const Transaction = require("../src/models/Transaction");
const User = require("../src/models/User");
const Wallet = require("../src/models/Wallet");

class ReferralService {
  /**
   * Process team cashback commissions - Simplified version
   */
// ✅ NEW — हा paste कर
static async processTeamCashback(userId, cashbackEarned, sourceType, sourceId = null) {
  // FIX: स्वतःचा session — wallet + earnings + transaction atomic होतात
  const mongoose = require("mongoose");
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (!user || !user.referredBy) {
      await session.abortTransaction();
      session.endSession();
      return { success: false, message: "No referrer found" };
    }

    let currentReferrerId = user.referredBy;
    let level = 1;
    const paidCommissions = [];

    console.log(`\n💰 Processing team cashback for user ${userId} - Amount: ₹${cashbackEarned}`);

    while (currentReferrerId && level <= 21) {
      const referrer = await User.findById(currentReferrerId).session(session);
      if (!referrer) break;

      const isAccessible = level <= referrer.directReferralsCount;

      if (!isAccessible) {
        console.log(`❌ Level ${level} NOT accessible for ${referrer.userId} - needs ${level} directs, has ${referrer.directReferralsCount}`);
        currentReferrerId = referrer.referredBy;
        level++;
        continue;
      }

      const rate = referrer.commissionRates?.[`level${level}`] || 0;
      const commission = Number((cashbackEarned * rate).toFixed(2));

      if (commission > 0) {
        console.log(`✅ Level ${level} - paying ${rate * 100}% = ₹${commission} to ${referrer.userId}`);

        // ── Cashback wallet ──────────────────────────────────────
        let cashbackWallet = await Wallet.findOne({
          user: referrer._id,
          type: "CASHBACK"
        }).session(session);

        if (!cashbackWallet) {
          cashbackWallet = new Wallet({ user: referrer._id, type: "CASHBACK", balance: 0 });
        }
        cashbackWallet.balance += commission;
        await cashbackWallet.save({ session });

        // ── Referrer earnings ────────────────────────────────────
        if (!referrer.earningsByLevel) referrer.earningsByLevel = {};
        referrer.earningsByLevel[`level${level}`] =
          (referrer.earningsByLevel[`level${level}`] || 0) + commission;
        referrer.totalEarnings = (referrer.totalEarnings || 0) + commission;

        // ── Leg earnings — FIX: .toString() वापरतो, .includes() नाही ──
        let legUpdated = false;
        for (let i = 0; i < referrer.legs.length; i++) {
          const leg = referrer.legs[i];
          let foundInLeg = false;

          // rootUser check
          if (leg.rootUser && leg.rootUser.toString() === userId.toString()) {
            foundInLeg = true;
          }

          // levels मध्ये check
          if (!foundInLeg) {
            for (let lvl = 1; lvl <= 21; lvl++) {
              const levelUsers = leg.levels[`level${lvl}`]?.users || [];
              if (levelUsers.some(u => u.toString() === userId.toString())) {
                foundInLeg = true;
                break;
              }
            }
          }

          if (foundInLeg) {
            leg.levels[`level${level}`].earnings += commission;
            leg.levels[`level${level}`].teamCashback += cashbackEarned;
            leg.stats.totalEarnings += commission;
            leg.stats.lastActivity = new Date();
            legUpdated = true;
            break;
          }
        }

        if (!legUpdated) {
          console.log(`⚠️ Could not find leg for user ${userId} under ${referrer.userId}`);
        }

        await referrer.save({ session });

        // ── Transaction record ───────────────────────────────────
        await Transaction.create([{
          user: referrer._id,
          type: "TEAM_CASHBACK",
          toWallet: "CASHBACK",
          amount: commission,
          relatedScanner: sourceId,
          meta: {
            level,
            rate: rate * 100 + "%",
            sourceUser: userId,
            sourceAmount: cashbackEarned,
            sourceType
          }
        }], { session });

        paidCommissions.push({
          userId: referrer._id,
          userName: referrer.userId,
          level,
          amount: commission
        });
      }

      currentReferrerId = referrer.referredBy;
      level++;
    }

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      paidCount: paidCommissions.length,
      paidAmount: paidCommissions.reduce((sum, pc) => sum + pc.amount, 0),
      paidCommissions
    };

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error processing team cashback:", error);
    return { success: false, error: error.message };
  }
}

  /**
   * Process when a new user joins (simplified)
   */
// ✅ NEW
static async processNewUserJoining(userId, referrerId, session = null) {
  try {
    const referrer = await User.findById(referrerId).session(session);
    if (!referrer) return;
    console.log(`\n👤 New user joined under ${referrer.userId}`);
    // FIX: session pass करतो
    await User.addToReferralTree(userId, referrerId, session);
  } catch (error) {
    console.error("Error processing new user joining:", error);
    throw error; // re-throw — caller च्या session ला abort करता यावं
  }
}

  /**
   * Get unlock status (simplified)
   */
  static async getUnlockStatus(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return null;
      
      return {
        totalLegs: user.legs.length,
        directReferrals: user.directReferralsCount,
        unlockedLevelsInEachLeg: user.directReferralsCount,
        isFullyUnlocked: user.directReferralsCount === 21,
        legs: user.legs.map(leg => ({
          legNumber: leg.legNumber,
          totalUsers: leg.stats.totalUsers,
          unlockedLevels: user.directReferralsCount
        }))
      };
      
    } catch (error) {
      console.error("Error getting unlock status:", error);
      return null;
    }
  }

  /**
   * Get next unlock requirements (simplified)
   */
  static async getNextUnlockRequirements(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return null;
      
      if (user.directReferralsCount >= 21) {
        return [{
          message: "🎉 Congratulations! All levels are unlocked!",
          completed: true
        }];
      }
      
      const nextLevel = user.directReferralsCount + 1;
      const levelsRemaining = 21 - user.directReferralsCount;
      
      return [{
        currentDirects: user.directReferralsCount,
        nextLevel: nextLevel,
        requirement: `Add ${nextLevel - user.directReferralsCount} more direct referral to unlock Level ${nextLevel} in all legs`,
        levelsToUnlock: nextLevel,
        levelsRemaining: levelsRemaining,
        message: `Add 1 direct referral to unlock Level ${nextLevel} in all ${user.legs.length} legs`
      }];
      
    } catch (error) {
      console.error("Error getting next unlock requirements:", error);
      return null;
    }
  }

  /**
   * Get team cashback summary (simplified)
   */
  static async getTeamCashbackSummary(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return null;

      const summary = {
        totalLegs: user.legs.length,
        directReferrals: user.directReferralsCount,
        totalTeam: user.teamStats?.totalTeam || 0,
        totalEarnings: user.totalEarnings || 0,
        unlockedLevelsInEachLeg: user.directReferralsCount,
        isFullyUnlocked: user.directReferralsCount === 21,
        legs: []
      };
      
      // Leg details
      for (const leg of user.legs) {
        summary.legs.push({
          legNumber: leg.legNumber,
          totalUsers: leg.stats.totalUsers,
          totalEarnings: leg.stats.totalEarnings,
          unlockedLevels: user.directReferralsCount
        });
      }
      
      // Level-wise stats
      for (let level = 1; level <= 21; level++) {
        const levelKey = `level${level}`;
        let usersAtLevel = 0;
        let earningsAtLevel = user.earningsByLevel?.[levelKey] || 0;
        
        for (const leg of user.legs) {
          usersAtLevel += leg.levels[levelKey]?.users.length || 0;
        }
        
        summary[`level${level}`] = {
          users: usersAtLevel,
          earnings: earningsAtLevel,
          isUnlocked: level <= user.directReferralsCount,
          commission: user.commissionRates?.[levelKey] || 0
        };
      }

      return summary;
      
    } catch (error) {
      console.error("Error getting team cashback summary:", error);
      return null;
    }
  }
}

module.exports = ReferralService;