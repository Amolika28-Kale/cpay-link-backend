// // services/referralService.js - FIXED VERSION
// const Transaction = require("../src/models/Transaction");
// const User = require("../src/models/User");
// const Wallet = require("../src/models/Wallet");


// class ReferralService {
//   /**
//    * Process team cashback commissions for all 21 levels
//    */
//   static async processTeamCashback(userId, cashbackEarned, sourceType, sourceId = null) {
//     try {
//       const user = await User.findById(userId);
//       if (!user || !user.referredBy) {
//         // console.log(`User ${userId} has no referrer, stopping commission chain`);
//         return;
//       }

//       let currentReferrerId = user.referredBy;
//       let level = 1;

//       // console.log(`\n💰 Processing team cashback for user ${userId} - Amount: ₹${cashbackEarned}`);

//       while (currentReferrerId && level <= 21) {
//         const referrer = await User.findById(currentReferrerId);
//         if (!referrer) break;

//         // CRITICAL: Check if this level's leg is unlocked
//         if (!referrer.isLegUnlocked(level)) {
//           // console.log(`❌ Level ${level} leg not unlocked for ${referrer.userId}, skipping commission`);
//           currentReferrerId = referrer.referredBy;
//           level++;
//           continue;
//         }

//         // Get commission rate
//         const rate = referrer.referralRates[`level${level}`] || 0;
//         const commission = Number((cashbackEarned * rate).toFixed(2));

//         if (commission > 0) {
//           // console.log(`✅ Level ${level} unlocked - Paying ${rate*100}% = ₹${commission} to ${referrer.userId}`);

//           // Add to cashback wallet
//           let cashbackWallet = await Wallet.findOne({
//             user: referrer._id,
//             type: "CASHBACK"
//           });

//           if (!cashbackWallet) {
//             cashbackWallet = new Wallet({
//               user: referrer._id,
//               type: "CASHBACK",
//               balance: 0
//             });
//           }

//           cashbackWallet.balance += commission;
//           await cashbackWallet.save();

//           // Update referral earnings
//           const updateQuery = {};
//           updateQuery[`referralEarnings.level${level}`] = (referrer.referralEarnings[`level${level}`] || 0) + commission;
//           updateQuery[`referralEarnings.total`] = (referrer.referralEarnings.total || 0) + commission;
          
//           // Update team cashback total
//           updateQuery[`teamCashback.level${level}.total`] = (referrer.teamCashback?.[`level${level}`]?.total || 0) + cashbackEarned;
          
//           await User.findByIdAndUpdate(
//             referrer._id,
//             { $set: updateQuery }
//           );

//           // Create transaction record
//           await Transaction.create({
//             user: referrer._id,
//             type: "TEAM_CASHBACK",
//             fromWallet: null,
//             toWallet: "CASHBACK",
//             amount: commission,
//             relatedScanner: sourceId,
//             meta: {
//               level: level,
//               rate: rate * 100 + "%",
//               sourceUser: userId,
//               sourceAmount: cashbackEarned,
//               sourceType: sourceType,
//               type: "TEAM_COMMISSION",
//               legUnlocked: true
//             }
//           });
//         }

//         currentReferrerId = referrer.referredBy;
//         level++;
//       }
      
//     } catch (error) {
//       // console.error("Error processing team cashback:", error);
//     }
//   }

//   /**
//    * Get team cashback summary with member details - FIXED VERSION
//    */
//   static async getTeamCashbackSummary(userId) {
//     try {
//       const user = await User.findById(userId);
//       if (!user) return null;

//       const teamStats = {
//         legsUnlocked: user.legsUnlocked
//       };
      
//       // Initialize stats for all 21 levels
//       for (let level = 1; level <= 21; level++) {
//         const levelUsers = user.referralTree?.[`level${level}`] || [];
        
//         const levelData = {
//           users: levelUsers.length,
//           yourCommission: user.referralEarnings?.[`level${level}`] || 0,
//           teamCashback: user.teamCashback?.[`level${level}`]?.total || 0,
//           unlocked: user.isLegUnlocked(level)
//         };

//         // ✅ FIX: Get detailed user information for this level
//         if (levelUsers.length > 0) {
//           const userDetails = await User.find(
//             { _id: { $in: levelUsers } },
//             'userId referralEarnings teamCashback'
//           );
          
//           levelData.usersList = userDetails.map(u => {
//             // Calculate team cashback from all levels
//             const teamCashbackTotal = Object.values(u.teamCashback || {}).reduce(
//               (sum, level) => sum + (level?.total || 0), 0
//             );
            
//             return {
//               userId: u.userId,
//               earnings: u.referralEarnings?.total || 0,
//               teamCashback: teamCashbackTotal,
//               // Add more details if needed
//               levelEarnings: u.referralEarnings || {},
//               legsUnlocked: u.legsUnlocked
//             };
//           });
//         } else {
//           levelData.usersList = [];
//         }

//         teamStats[`level${level}`] = levelData;
//       }

//       return teamStats;
//     } catch (error) {
//       // console.error("Error getting team cashback summary:", error);
//       return null;
//     }
//   }
// }

// module.exports = ReferralService;


// services/referralService.js - UPDATED for Dynamic Legs
const Transaction = require("../src/models/Transaction");
const User = require("../src/models/User");
const Wallet = require("../src/models/Wallet");

class ReferralService {
  /**
   * Process team cashback commissions for all 21 levels
   * हे फंक्शन आता dynamic legs साठी अपडेट केलं आहे
   */
  static async processTeamCashback(userId, cashbackEarned, sourceType, sourceId = null) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.referredBy) {
        // console.log(`User ${userId} has no referrer, stopping commission chain`);
        return;
      }

      let currentReferrerId = user.referredBy;
      let level = 1;

      // console.log(`\n💰 Processing team cashback for user ${userId} - Amount: ₹${cashbackEarned}`);

      while (currentReferrerId && level <= 21) {
        const referrer = await User.findById(currentReferrerId);
        if (!referrer) break;

        // ========== CRITICAL CHANGE ==========
        // नवीन schema मध्ये isLevelAccessible method वापरा
        // हे check करेल की हे level referrer च्या कोणत्या तरी leg मध्ये accessible आहे का?
        if (!referrer.isLevelAccessible(level)) {
          console.log(`❌ Level ${level} not accessible for ${referrer.userId}, skipping commission`);
          currentReferrerId = referrer.referredBy;
          level++;
          continue;
        }

        // Get commission rate - नवीन schema मध्ये commissionRates वापरा
        const rate = referrer.commissionRates?.[`level${level}`] || 0;
        const commission = Number((cashbackEarned * rate).toFixed(2));

        if (commission > 0) {
          console.log(`✅ Level ${level} accessible - Paying ${rate*100}% = ₹${commission} to ${referrer.userId}`);

          // Add to cashback wallet
          let cashbackWallet = await Wallet.findOne({
            user: referrer._id,
            type: "CASHBACK"
          });

          if (!cashbackWallet) {
            cashbackWallet = new Wallet({
              user: referrer._id,
              type: "CASHBACK",
              balance: 0
            });
          }

          cashbackWallet.balance += commission;
          await cashbackWallet.save();

          // ========== CRITICAL CHANGE ==========
          // नवीन schema मध्ये earningsByLevel आणि totalEarnings वापरा
          // Update referrer's earnings
          referrer.earningsByLevel[`level${level}`] = 
            (referrer.earningsByLevel[`level${level}`] || 0) + commission;
          referrer.totalEarnings = (referrer.totalEarnings || 0) + commission;
          
          // Update team stats
          referrer.teamStats.totalTeam = referrer.teamStats.totalTeam || 0;
          referrer.teamStats.lastUpdated = new Date();
          
          // Find which leg this user belongs to and update that leg's earnings
          for (let legIndex = 0; legIndex < referrer.legs.length; legIndex++) {
            const leg = referrer.legs[legIndex];
            const levelKey = `level${level}`;
            
            if (leg.levels[levelKey]?.users.includes(userId)) {
              // Update leg-specific earnings
              leg.levels[levelKey].earnings = 
                (leg.levels[levelKey].earnings || 0) + commission;
              leg.stats.totalEarnings = 
                (leg.stats.totalEarnings || 0) + commission;
              leg.stats.lastActivity = new Date();
              break;
            }
          }
          
          await referrer.save();

          // Create transaction record
          await Transaction.create({
            user: referrer._id,
            type: "TEAM_CASHBACK",
            fromWallet: null,
            toWallet: "CASHBACK",
            amount: commission,
            relatedScanner: sourceId,
            meta: {
              level: level,
              rate: rate * 100 + "%",
              sourceUser: userId,
              sourceAmount: cashbackEarned,
              sourceType: sourceType,
              type: "TEAM_COMMISSION",
              legUnlocked: true
            }
          });
        }

        currentReferrerId = referrer.referredBy;
        level++;
      }
      
    } catch (error) {
      console.error("Error processing team cashback:", error);
    }
  }

  /**
   * Get team cashback summary with member details - UPDATED for Dynamic Legs
   */
  static async getTeamCashbackSummary(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return null;

      // ========== CRITICAL CHANGE ==========
      // नवीन schema च्या getTeamSummary method वापरा
      const teamSummary = user.getTeamSummary();
      
      const teamStats = {
        totalLegs: user.legs.length,
        directReferrals: user.directReferralsCount,
        totalTeam: user.teamStats.totalTeam,
        totalEarnings: user.totalEarnings,
        legsUnlocked: {} // नवीन schema मध्ये legsUnlocked ऑब्जेक्ट नाही
      };
      
      // Leg unlocking status extract करा
      for (let i = 0; i < user.legs.length; i++) {
        teamStats.legsUnlocked[`leg${i+1}`] = true; // सगळ्या legs unlocked आहेत कारण direct referrals आहेत
      }
      
      // Initialize stats for all 21 levels using the new structure
      for (let level = 1; level <= 21; level++) {
        const levelKey = `level${level}`;
        
        // Get users at this level from all legs
        const usersAtLevel = [];
        let teamCashbackTotal = 0;
        
        for (const leg of user.legs) {
          const levelData = leg.levels[levelKey];
          if (levelData) {
            // Add users from this leg at this level
            usersAtLevel.push(...levelData.users);
            // Sum team cashback from this leg at this level
            teamCashbackTotal += levelData.teamCashback || 0;
          }
        }
        
        const levelData = {
          users: usersAtLevel.length,
          yourCommission: user.earningsByLevel?.[levelKey] || 0,
          teamCashback: teamCashbackTotal,
          unlocked: user.isLevelAccessible(level) // Check if level is accessible in any leg
        };

        // Get detailed user information for this level
        if (usersAtLevel.length > 0) {
          const userDetails = await User.find(
            { _id: { $in: usersAtLevel } },
            'userId earningsByLevel totalEarnings legs'
          );
          
          levelData.usersList = userDetails.map(u => {
            // Calculate total earnings for this user
            const totalEarnings = u.totalEarnings || 0;
            
            // Calculate team cashback from user's own downline
            let teamCashbackFromUser = 0;
            if (u.legs) {
              for (const leg of u.legs) {
                for (let lvl = 1; lvl <= 21; lvl++) {
                  teamCashbackFromUser += leg.levels[`level${lvl}`]?.teamCashback || 0;
                }
              }
            }
            
            return {
              userId: u.userId,
              earnings: totalEarnings,
              teamCashback: teamCashbackFromUser,
              levelEarnings: u.earningsByLevel || {},
              totalLegs: u.legs?.length || 0
            };
          });
        } else {
          levelData.usersList = [];
        }

        teamStats[`level${level}`] = levelData;
      }

      return teamStats;
      
    } catch (error) {
      console.error("Error getting team cashback summary:", error);
      return null;
    }
  }

  /**
   * Get leg-wise breakdown for a user
   */
  static async getLegWiseBreakdown(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return null;
      
      return user.getLegSummary();
      
    } catch (error) {
      console.error("Error getting leg-wise breakdown:", error);
      return null;
    }
  }

  /**
   * Calculate potential commission for a user at a specific level
   */
  static calculatePotentialCommission(amount, level) {
    const rates = User.getCommissionRates();
    const rate = rates[`level${level}`] || 0;
    return {
      level,
      rate: rate * 100,
      commission: amount * rate,
      amount
    };
  }
}

module.exports = ReferralService;