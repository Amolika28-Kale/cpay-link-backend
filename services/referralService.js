// // // services/referralService.js - FIXED VERSION
// // const Transaction = require("../src/models/Transaction");
// // const User = require("../src/models/User");
// // const Wallet = require("../src/models/Wallet");


// // class ReferralService {
// //   /**
// //    * Process team cashback commissions for all 21 levels
// //    */
// //   static async processTeamCashback(userId, cashbackEarned, sourceType, sourceId = null) {
// //     try {
// //       const user = await User.findById(userId);
// //       if (!user || !user.referredBy) {
// //         // console.log(`User ${userId} has no referrer, stopping commission chain`);
// //         return;
// //       }

// //       let currentReferrerId = user.referredBy;
// //       let level = 1;

// //       // console.log(`\n💰 Processing team cashback for user ${userId} - Amount: ₹${cashbackEarned}`);

// //       while (currentReferrerId && level <= 21) {
// //         const referrer = await User.findById(currentReferrerId);
// //         if (!referrer) break;

// //         // CRITICAL: Check if this level's leg is unlocked
// //         if (!referrer.isLegUnlocked(level)) {
// //           // console.log(`❌ Level ${level} leg not unlocked for ${referrer.userId}, skipping commission`);
// //           currentReferrerId = referrer.referredBy;
// //           level++;
// //           continue;
// //         }

// //         // Get commission rate
// //         const rate = referrer.referralRates[`level${level}`] || 0;
// //         const commission = Number((cashbackEarned * rate).toFixed(2));

// //         if (commission > 0) {
// //           // console.log(`✅ Level ${level} unlocked - Paying ${rate*100}% = ₹${commission} to ${referrer.userId}`);

// //           // Add to cashback wallet
// //           let cashbackWallet = await Wallet.findOne({
// //             user: referrer._id,
// //             type: "CASHBACK"
// //           });

// //           if (!cashbackWallet) {
// //             cashbackWallet = new Wallet({
// //               user: referrer._id,
// //               type: "CASHBACK",
// //               balance: 0
// //             });
// //           }

// //           cashbackWallet.balance += commission;
// //           await cashbackWallet.save();

// //           // Update referral earnings
// //           const updateQuery = {};
// //           updateQuery[`referralEarnings.level${level}`] = (referrer.referralEarnings[`level${level}`] || 0) + commission;
// //           updateQuery[`referralEarnings.total`] = (referrer.referralEarnings.total || 0) + commission;
          
// //           // Update team cashback total
// //           updateQuery[`teamCashback.level${level}.total`] = (referrer.teamCashback?.[`level${level}`]?.total || 0) + cashbackEarned;
          
// //           await User.findByIdAndUpdate(
// //             referrer._id,
// //             { $set: updateQuery }
// //           );

// //           // Create transaction record
// //           await Transaction.create({
// //             user: referrer._id,
// //             type: "TEAM_CASHBACK",
// //             fromWallet: null,
// //             toWallet: "CASHBACK",
// //             amount: commission,
// //             relatedScanner: sourceId,
// //             meta: {
// //               level: level,
// //               rate: rate * 100 + "%",
// //               sourceUser: userId,
// //               sourceAmount: cashbackEarned,
// //               sourceType: sourceType,
// //               type: "TEAM_COMMISSION",
// //               legUnlocked: true
// //             }
// //           });
// //         }

// //         currentReferrerId = referrer.referredBy;
// //         level++;
// //       }
      
// //     } catch (error) {
// //       // console.error("Error processing team cashback:", error);
// //     }
// //   }

// //   /**
// //    * Get team cashback summary with member details - FIXED VERSION
// //    */
// //   static async getTeamCashbackSummary(userId) {
// //     try {
// //       const user = await User.findById(userId);
// //       if (!user) return null;

// //       const teamStats = {
// //         legsUnlocked: user.legsUnlocked
// //       };
      
// //       // Initialize stats for all 21 levels
// //       for (let level = 1; level <= 21; level++) {
// //         const levelUsers = user.referralTree?.[`level${level}`] || [];
        
// //         const levelData = {
// //           users: levelUsers.length,
// //           yourCommission: user.referralEarnings?.[`level${level}`] || 0,
// //           teamCashback: user.teamCashback?.[`level${level}`]?.total || 0,
// //           unlocked: user.isLegUnlocked(level)
// //         };

// //         // ✅ FIX: Get detailed user information for this level
// //         if (levelUsers.length > 0) {
// //           const userDetails = await User.find(
// //             { _id: { $in: levelUsers } },
// //             'userId referralEarnings teamCashback'
// //           );
          
// //           levelData.usersList = userDetails.map(u => {
// //             // Calculate team cashback from all levels
// //             const teamCashbackTotal = Object.values(u.teamCashback || {}).reduce(
// //               (sum, level) => sum + (level?.total || 0), 0
// //             );
            
// //             return {
// //               userId: u.userId,
// //               earnings: u.referralEarnings?.total || 0,
// //               teamCashback: teamCashbackTotal,
// //               // Add more details if needed
// //               levelEarnings: u.referralEarnings || {},
// //               legsUnlocked: u.legsUnlocked
// //             };
// //           });
// //         } else {
// //           levelData.usersList = [];
// //         }

// //         teamStats[`level${level}`] = levelData;
// //       }

// //       return teamStats;
// //     } catch (error) {
// //       // console.error("Error getting team cashback summary:", error);
// //       return null;
// //     }
// //   }
// // }

// // module.exports = ReferralService;


// // services/referralService.js - COMPLETE with Independent Legs and FOMO Notifications
// const Transaction = require("../src/models/Transaction");
// const User = require("../src/models/User");
// const Wallet = require("../src/models/Wallet");

// class ReferralService {
//   /**
//    * Get horizontal requirements for levels
//    */
//   static getHorizontalRequirements() {
//     return {
//       4: 2, 5: 2, 6: 2,
//       7: 3, 8: 3, 9: 3,
//       10: 4, 11: 4, 12: 4,
//       13: 5, 14: 5, 15: 5,
//       16: 6, 17: 6, 18: 6,
//       19: 7, 20: 7, 21: 7
//     };
//   }

//   /**
//    * Get required previous levels for a given level
//    */
//   static getRequiredLevels(levelNum) {
//     const requirements = {
//       4: [1, 2, 3],
//       5: [2, 3, 4],
//       6: [3, 4, 5],
//       7: [4, 5, 6],
//       8: [5, 6, 7],
//       9: [6, 7, 8],
//       10: [7, 8, 9],
//       11: [8, 9, 10],
//       12: [9, 10, 11],
//       13: [10, 11, 12],
//       14: [11, 12, 13],
//       15: [12, 13, 14],
//       16: [13, 14, 15],
//       17: [14, 15, 16],
//       18: [15, 16, 17],
//       19: [16, 17, 18],
//       20: [17, 18, 19],
//       21: [18, 19, 20]
//     };
//     return requirements[levelNum] || [];
//   }

//   /**
//    * Process team cashback commissions for all 21 levels
//    * With strict level accessibility check and FOMO notifications
//    * प्रत्येक leg स्वतंत्रपणे काम करते
//    */
//   static async processTeamCashback(userId, cashbackEarned, sourceType, sourceId = null) {
//     try {
//       const user = await User.findById(userId);
//       if (!user || !user.referredBy) {
//         return { success: false, message: "No referrer found" };
//       }

//       let currentReferrerId = user.referredBy;
//       let level = 1;
//       const missedCommissions = [];
//       const paidCommissions = [];

//       console.log(`\n💰 Processing team cashback for user ${userId} - Amount: ₹${cashbackEarned}`);

//       while (currentReferrerId && level <= 21) {
//         const referrer = await User.findById(currentReferrerId);
//         if (!referrer) break;

//         // ===== FIND WHICH LEG THIS USER BELONGS TO =====
//         let targetLegIndex = -1;
//         for (let i = 0; i < referrer.legs.length; i++) {
//           const leg = referrer.legs[i];
//           for (let lvl = 1; lvl <= 21; lvl++) {
//             const levelKey = `level${lvl}`;
//             if (leg.levels[levelKey]?.users.includes(userId)) {
//               targetLegIndex = i;
//               break;
//             }
//           }
//           if (targetLegIndex !== -1) break;
//         }

//         // Get commission rate
//         const rate = referrer.commissionRates?.[`level${level}`] || 0;
//         const commission = Number((cashbackEarned * rate).toFixed(2));

//         // ===== CRITICAL: Check if this level is accessible =====
//         const isAccessible = referrer.isLevelAccessible(level, targetLegIndex);

//         if (!isAccessible) {
//           // ===== MISSED COMMISSION - FOMO EVENT =====
//           console.log(`❌ Level ${level} NOT accessible for ${referrer.userId} in leg ${targetLegIndex + 1}`);
          
//           // Determine reason
//           let reason = "Unknown";
//           const horizontalReqs = this.getHorizontalRequirements();
//           const minDirectsNeeded = horizontalReqs[level] || (level <= 3 ? 1 : 999);
//           const requiredLevels = this.getRequiredLevels(level);
          
//           if (referrer.legs.length < minDirectsNeeded) {
//             reason = `Need ${minDirectsNeeded} direct referrals (have ${referrer.legs.length})`;
//           } else if (targetLegIndex >= 0) {
//             const leg = referrer.legs[targetLegIndex];
            
//             // Check which previous levels are empty
//             const emptyLevels = [];
//             for (const reqLevel of requiredLevels) {
//               const reqLevelKey = `level${reqLevel}`;
//               if (leg.levels[reqLevelKey]?.users.length === 0) {
//                 emptyLevels.push(reqLevel);
//               }
//             }
            
//             if (emptyLevels.length > 0) {
//               reason = `Previous levels ${emptyLevels.join(', ')} in Leg ${targetLegIndex + 1} are empty`;
//             } else {
//               reason = `Level cannot be unlocked yet`;
//             }
//           }

//           // Create missed commission record
//           const missedData = {
//             amount: commission,
//             level,
//             legNumber: targetLegIndex >= 0 ? targetLegIndex + 1 : 0,
//             reason,
//             sourceUserId: userId,
//             sourceAmount: cashbackEarned,
//             date: new Date(),
//             read: false
//           };

//           // Add to referrer's missed commissions array
//           if (!referrer.missedCommissions) {
//             referrer.missedCommissions = [];
//           }
//           referrer.missedCommissions.push(missedData);
//           await referrer.save();

//           // Add to result array
//           missedCommissions.push({
//             userId: referrer._id,
//             userName: referrer.userId,
//             ...missedData
//           });

//           currentReferrerId = referrer.referredBy;
//           level++;
//           continue;
//         }

//         // ===== PAY COMMISSION IF ACCESSIBLE =====
//         if (commission > 0) {
//           console.log(`✅ Level ${level} accessible - Paying ${rate*100}% = ₹${commission} to ${referrer.userId} in Leg ${targetLegIndex + 1}`);

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

//           // Update referrer's earnings
//           if (!referrer.earningsByLevel) referrer.earningsByLevel = {};
//           referrer.earningsByLevel[`level${level}`] = 
//             (referrer.earningsByLevel[`level${level}`] || 0) + commission;
//           referrer.totalEarnings = (referrer.totalEarnings || 0) + commission;
          
//           // Update team stats
//           if (!referrer.teamStats) {
//             referrer.teamStats = { totalTeam: 0, activeLegs: 0, lastUpdated: new Date() };
//           }
//           referrer.teamStats.totalTeam = referrer.teamStats.totalTeam || 0;
//           referrer.teamStats.lastUpdated = new Date();
          
//           // Find which leg this user belongs to and update that leg's earnings
//           if (targetLegIndex >= 0) {
//             const leg = referrer.legs[targetLegIndex];
//             const levelKey = `level${level}`;
            
//             if (!leg.levels[levelKey].earnings) {
//               leg.levels[levelKey].earnings = 0;
//             }
//             leg.levels[levelKey].earnings += commission;
            
//             if (!leg.stats.totalEarnings) leg.stats.totalEarnings = 0;
//             leg.stats.totalEarnings += commission;
//             leg.stats.lastActivity = new Date();
//           }
          
//           await referrer.save();

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
//               legNumber: targetLegIndex >= 0 ? targetLegIndex + 1 : 'unknown',
//               legUnlocked: true
//             }
//           });

//           paidCommissions.push({
//             userId: referrer._id,
//             userName: referrer.userId,
//             level,
//             amount: commission,
//             legNumber: targetLegIndex >= 0 ? targetLegIndex + 1 : 0
//           });
//         }

//         currentReferrerId = referrer.referredBy;
//         level++;
//       }
      
//       // ===== RETURN COMPLETE RESULT =====
//       const totalMissed = missedCommissions.reduce((sum, mc) => sum + mc.amount, 0);
      
//       return {
//         success: true,
//         paidCount: paidCommissions.length,
//         paidAmount: paidCommissions.reduce((sum, pc) => sum + pc.amount, 0),
//         paidCommissions,
//         missedCount: missedCommissions.length,
//         missedAmount: totalMissed,
//         missedCommissions,
//         message: missedCommissions.length > 0 
//           ? `⚠️ You missed ₹${totalMissed.toFixed(2)} in commissions! Add more referrals or build your downline to unlock.` 
//           : null,
//         fomoNotifications: missedCommissions.map(mc => ({
//           id: mc._id,
//           title: "💰 Missed Commission Opportunity!",
//           message: `You missed ₹${mc.amount.toFixed(2)} from Leg ${mc.legNumber} Level ${mc.level}. ${mc.reason}. Unlock it now by adding more users to your downline!`,
//           amount: mc.amount,
//           level: mc.level,
//           legNumber: mc.legNumber,
//           reason: mc.reason,
//           date: mc.date,
//           read: mc.read
//         }))
//       };
      
//     } catch (error) {
//       console.error("Error processing team cashback:", error);
//       return { success: false, error: error.message };
//     }
//   }

//   /**
//    * Get missed commissions summary for a user
//    */
//   static async getMissedCommissionsSummary(userId) {
//     try {
//       const user = await User.findById(userId);
//       if (!user) return null;
      
//       if (!user.missedCommissions) {
//         return { totalMissed: 0, unreadCount: 0, recent: [] };
//       }
      
//       const totalMissed = user.missedCommissions.reduce((sum, mc) => sum + (mc.amount || 0), 0);
//       const unreadCount = user.missedCommissions.filter(mc => !mc.read).length;
//       const recent = user.missedCommissions.slice(-10).reverse();
      
//       return {
//         totalMissed,
//         unreadCount,
//         recent
//       };
      
//     } catch (error) {
//       console.error("Error getting missed commissions:", error);
//       return null;
//     }
//   }

//   /**
//    * Mark missed commissions as read
//    */
//   static async markMissedCommissionsAsRead(userId, commissionIds = []) {
//     try {
//       const user = await User.findById(userId);
//       if (!user) return false;
      
//       if (!user.missedCommissions) {
//         user.missedCommissions = [];
//         await user.save();
//         return true;
//       }
      
//       if (commissionIds.length === 0) {
//         // Mark all as read
//         user.missedCommissions.forEach(mc => { mc.read = true; });
//       } else {
//         // Mark specific ones as read
//         user.missedCommissions.forEach(mc => {
//           if (commissionIds.includes(mc._id?.toString())) {
//             mc.read = true;
//           }
//         });
//       }
      
//       await user.save();
//       return true;
      
//     } catch (error) {
//       console.error("Error marking commissions as read:", error);
//       return false;
//     }
//   }

//   /**
//    * Get FOMO notifications for a user
//    */
//   static async getFomoNotifications(userId) {
//     try {
//       const user = await User.findById(userId);
//       if (!user) return { total: 0, notifications: [] };
      
//       if (!user.missedCommissions) {
//         return { total: 0, notifications: [] };
//       }
      
//       const unreadMissed = user.missedCommissions.filter(mc => !mc.read);
      
//       const notifications = unreadMissed.map(mc => ({
//         id: mc._id,
//         title: "💰 Missed Commission Opportunity!",
//         message: `You missed ₹${mc.amount?.toFixed(2) || '0'} from Leg ${mc.legNumber || '?'} Level ${mc.level}. ${mc.reason || 'Unknown reason'}. Unlock it now by adding more users to your downline!`,
//         amount: mc.amount,
//         level: mc.level,
//         legNumber: mc.legNumber,
//         reason: mc.reason,
//         date: mc.date,
//         read: mc.read
//       }));
      
//       return {
//         total: notifications.length,
//         notifications
//       };
      
//     } catch (error) {
//       console.error("Error getting FOMO notifications:", error);
//       return { total: 0, notifications: [] };
//     }
//   }

//   /**
//    * Get team cashback summary with member details
//    */
//   static async getTeamCashbackSummary(userId) {
//     try {
//       const user = await User.findById(userId);
//       if (!user) return null;

//       const teamSummary = user.getTeamSummary ? user.getTeamSummary() : {};
      
//       const teamStats = {
//         totalLegs: user.legs?.length || 0,
//         directReferrals: user.directReferralsCount || 0,
//         totalTeam: user.teamStats?.totalTeam || 0,
//         totalEarnings: user.totalEarnings || 0,
//         missedCommissions: await this.getMissedCommissionsSummary(userId),
//         legs: []
//       };
      
//       // Add leg details
//       for (let i = 0; i < (user.legs || []).length; i++) {
//         const leg = user.legs[i];
        
//         // Calculate unlocked levels in this leg
//         let unlockedCount = 0;
//         for (let level = 1; level <= 21; level++) {
//           if (leg.levels?.[`level${level}`]?.isUnlocked) unlockedCount++;
//         }
        
//         teamStats.legs.push({
//           legNumber: leg.legNumber,
//           isActive: leg.isActive !== false, // सगळ्या legs active
//           totalUsers: leg.stats?.totalUsers || 0,
//           totalEarnings: leg.stats?.totalEarnings || 0,
//           unlockedLevels: unlockedCount,
//           isFullyUnlocked: unlockedCount === 21
//         });
//       }
      
//       // Initialize stats for all 21 levels
//       for (let level = 1; level <= 21; level++) {
//         const levelKey = `level${level}`;
        
//         // Get users at this level from all legs
//         const usersAtLevel = [];
//         let teamCashbackTotal = 0;
        
//         for (const leg of user.legs || []) {
//           const levelData = leg.levels?.[levelKey];
//           if (levelData) {
//             usersAtLevel.push(...(levelData.users || []));
//             teamCashbackTotal += levelData.teamCashback || 0;
//           }
//         }
        
//         const horizontalReqs = this.getHorizontalRequirements();
//         const minDirectsNeeded = horizontalReqs[level] || (level <= 3 ? 1 : 999);
        
//         const levelData = {
//           users: usersAtLevel.length,
//           yourCommission: user.earningsByLevel?.[levelKey] || 0,
//           teamCashback: teamCashbackTotal,
//           unlocked: user.isLevelAccessible ? user.isLevelAccessible(level) : (level <= 3),
//           requiredDirects: minDirectsNeeded,
//           currentDirects: user.legs?.length || 0
//         };

//         // Get detailed user information for this level
//         if (usersAtLevel.length > 0) {
//           const userDetails = await User.find(
//             { _id: { $in: usersAtLevel } },
//             'userId earningsByLevel totalEarnings legs'
//           );
          
//           levelData.usersList = userDetails.map(u => {
//             const totalEarnings = u.totalEarnings || 0;
            
//             // Calculate team cashback from user's own downline
//             let teamCashbackFromUser = 0;
//             if (u.legs) {
//               for (const leg of u.legs) {
//                 for (let lvl = 1; lvl <= 21; lvl++) {
//                   teamCashbackFromUser += leg.levels?.[`level${lvl}`]?.teamCashback || 0;
//                 }
//               }
//             }
            
//             return {
//               userId: u.userId,
//               earnings: totalEarnings,
//               teamCashback: teamCashbackFromUser,
//               levelEarnings: u.earningsByLevel || {},
//               totalLegs: u.legs?.length || 0
//             };
//           });
//         } else {
//           levelData.usersList = [];
//         }

//         teamStats[`level${level}`] = levelData;
//       }

//       return teamStats;
      
//     } catch (error) {
//       console.error("Error getting team cashback summary:", error);
//       return null;
//     }
//   }

//   /**
//    * Get leg-wise breakdown for a user
//    */
//   static async getLegWiseBreakdown(userId) {
//     try {
//       const user = await User.findById(userId);
//       if (!user) return null;
      
//       return user.getLegSummary ? user.getLegSummary() : { totalLegs: 0, legs: [] };
      
//     } catch (error) {
//       console.error("Error getting leg-wise breakdown:", error);
//       return null;
//     }
//   }

//   /**
//    * Calculate potential commission for a user at a specific level
//    */
//   static calculatePotentialCommission(amount, level) {
//     const rates = {
//       level1: 0.30, level2: 0.15, level3: 0.10, level4: 0.05, level5: 0.30,
//       level6: 0.03, level7: 0.04, level8: 0.03, level9: 0.03, level10: 0.30,
//       level11: 0.03, level12: 0.03, level13: 0.03, level14: 0.03, level15: 0.03,
//       level16: 0.05, level17: 0.10, level18: 0.15, level19: 0.30, level20: 0.30,
//       level21: 0.63
//     };
//     const rate = rates[`level${level}`] || 0;
//     return {
//       level,
//       rate: rate * 100,
//       commission: amount * rate,
//       amount
//     };
//   }

//   /**
//    * Check if a level can be unlocked for a specific leg
//    */
//   static canUnlockLevel(referrer, level, legIndex) {
//     if (level <= 3) return true;
    
//     const horizontalReqs = this.getHorizontalRequirements();
//     const minDirectsNeeded = horizontalReqs[level] || 999;
    
//     if (referrer.legs.length < minDirectsNeeded) return false;
    
//     if (legIndex >= 0 && referrer.legs[legIndex]) {
//       const leg = referrer.legs[legIndex];
//       const requiredLevels = this.getRequiredLevels(level);
      
//       for (const reqLevel of requiredLevels) {
//         const reqLevelKey = `level${reqLevel}`;
//         if (leg.levels[reqLevelKey]?.users.length === 0) {
//           return false;
//         }
//       }
//       return true;
//     }
    
//     return false;
//   }
// }

// module.exports = ReferralService;

// services/referralService.js - SIMPLIFIED VERSION
const Transaction = require("../src/models/Transaction");
const User = require("../src/models/User");
const Wallet = require("../src/models/Wallet");

class ReferralService {
  /**
   * Process team cashback commissions - Simplified version
   */
  static async processTeamCashback(userId, cashbackEarned, sourceType, sourceId = null) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.referredBy) {
        return { success: false, message: "No referrer found" };
      }

      let currentReferrerId = user.referredBy;
      let level = 1;
      const paidCommissions = [];

      console.log(`\n💰 Processing team cashback for user ${userId} - Amount: ₹${cashbackEarned}`);

      while (currentReferrerId && level <= 21) {
        const referrer = await User.findById(currentReferrerId);
        if (!referrer) break;

        // ===== SIMPLE CHECK: Level accessible फक्त direct referrals count नुसार =====
        const isAccessible = level <= referrer.directReferralsCount;

        if (!isAccessible) {
          console.log(`❌ Level ${level} NOT accessible for ${referrer.userId} - Need ${level} direct referrals, have ${referrer.directReferralsCount}`);
          currentReferrerId = referrer.referredBy;
          level++;
          continue;
        }

        // ===== PAY COMMISSION IF ACCESSIBLE =====
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

          // Update referrer's earnings
          if (!referrer.earningsByLevel) referrer.earningsByLevel = {};
          referrer.earningsByLevel[`level${level}`] = 
            (referrer.earningsByLevel[`level${level}`] || 0) + commission;
          referrer.totalEarnings = (referrer.totalEarnings || 0) + commission;
          
          // Find which leg this user belongs to
          for (let i = 0; i < referrer.legs.length; i++) {
            const leg = referrer.legs[i];
            for (let lvl = 1; lvl <= level; lvl++) {
              if (leg.levels[`level${lvl}`]?.users.includes(userId)) {
                // Update that leg's earnings
                leg.levels[`level${level}`].earnings += commission;
                leg.stats.totalEarnings += commission;
                leg.stats.lastActivity = new Date();
                leg.levels[`level${level}`].teamCashback += cashbackEarned;
                break;
              }
            }
          }
          
          await referrer.save();

          // Create transaction record
          await Transaction.create({
            user: referrer._id,
            type: "TEAM_CASHBACK",
            toWallet: "CASHBACK",
            amount: commission,
            relatedScanner: sourceId,
            meta: {
              level: level,
              rate: rate * 100 + "%",
              sourceUser: userId,
              sourceAmount: cashbackEarned,
              sourceType: sourceType
            }
          });

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
      
      return {
        success: true,
        paidCount: paidCommissions.length,
        paidAmount: paidCommissions.reduce((sum, pc) => sum + pc.amount, 0),
        paidCommissions
      };
      
    } catch (error) {
      console.error("Error processing team cashback:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process when a new user joins (simplified)
   */
  static async processNewUserJoining(userId, referrerId) {
    try {
      const referrer = await User.findById(referrerId);
      if (!referrer) return;

      console.log(`\n👤 New user joined under ${referrer.userId}`);

      // Add to referral tree - new logic handles everything
      await User.addToReferralTree(userId, referrerId);

    } catch (error) {
      console.error("Error processing new user joining:", error);
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