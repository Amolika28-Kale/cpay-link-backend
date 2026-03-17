// fixLevelDistribution.js
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://cpaylink11:cpaylink11@cluster0.zdbgyfs.mongodb.net/cpaylink?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI).then(async () => {
  console.log('✅ MongoDB Connected Successfully');
  await fixLevelDistribution();
}).catch(err => {
  console.error('❌ MongoDB Connection Error:', err);
  process.exit(1);
});

/**
 * Helper function to get required previous levels
 */
function getRequiredLevels(levelNum) {
  const requirements = {
    4: [1, 2, 3], 5: [2, 3, 4], 6: [3, 4, 5],
    7: [4, 5, 6], 8: [5, 6, 7], 9: [6, 7, 8],
    10: [7, 8, 9], 11: [8, 9, 10], 12: [9, 10, 11],
    13: [10, 11, 12], 14: [11, 12, 13], 15: [12, 13, 14],
    16: [13, 14, 15], 17: [14, 15, 16], 18: [15, 16, 17],
    19: [16, 17, 18], 20: [17, 18, 19], 21: [18, 19, 20]
  };
  return requirements[levelNum] || [];
}

/**
 * Get horizontal requirements
 */
function getHorizontalRequirements(levelNum) {
  if (levelNum <= 3) return 1;
  if (levelNum <= 6) return 2;
  if (levelNum <= 9) return 3;
  if (levelNum <= 12) return 4;
  if (levelNum <= 15) return 5;
  if (levelNum <= 18) return 6;
  return 7;
}

/**
 * Calculate commission rate
 */
function getCommissionRate(levelNum) {
  const rates = {
    1: 0.30, 2: 0.15, 3: 0.10, 4: 0.05, 5: 0.30,
    6: 0.03, 7: 0.04, 8: 0.03, 9: 0.03, 10: 0.30,
    11: 0.03, 12: 0.03, 13: 0.03, 14: 0.03, 15: 0.03,
    16: 0.05, 17: 0.10, 18: 0.15, 19: 0.30, 20: 0.30,
    21: 0.63
  };
  return rates[levelNum] || 0;
}

/**
 * Initialize level structure for a leg
 */
function initializeLevels() {
  const levels = {};
  for (let levelNum = 1; levelNum <= 21; levelNum++) {
    levels[`level${levelNum}`] = {
      users: [],
      earnings: 0,
      teamCashback: 0,
      isUnlocked: levelNum <= 3, // Levels 1-3 always unlocked
      unlockedAt: levelNum <= 3 ? new Date() : null,
      requiredLevels: []
    };
  }
  return levels;
}

/**
 * MAIN FIX FUNCTION
 */
const fixLevelDistribution = async () => {
  try {
    console.log("\n🔍 FIXING LEVEL DISTRIBUTION...");
    console.log("========================================");
    
    // Get all users
    const allUsers = await User.find({});
    console.log(`Total users found: ${allUsers.length}\n`);
    
    let stats = {
      processed: 0,
      fixedLevels: 0,
      newLegsCreated: 0,
      missedCommissionsAdded: 0,
      totalMissedAmount: 0,
      usersWithEmptyLevels: 0,
      level2Fixed: 0,
      level3Fixed: 0,
      level4Unlocked: 0
    };
    
    // ===== STEP 1: Fix Level Distribution =====
    for (const user of allUsers) {
      stats.processed++;
      
      if (!user.legs || user.legs.length === 0) {
        console.log(`\n👤 [${stats.processed}/${allUsers.length}] ${user.userId || user._id} - No legs, skipping`);
        continue;
      }
      
      console.log(`\n👤 [${stats.processed}/${allUsers.length}] ${user.userId || user._id}`);
      console.log(`   Legs: ${user.legs.length}, Directs: ${user.directReferralsCount || 0}`);
      
      // Get all downline users
      const downlineUsers = await User.find({ referredBy: user._id });
      const downlineIds = downlineUsers.map(u => u._id);
      
      // Get all users in tree (including indirect)
      const allTeamMembers = [];
      for (const leg of user.legs) {
        for (let levelNum = 1; levelNum <= 21; levelNum++) {
          const levelKey = `level${levelNum}`;
          if (leg.levels[levelKey]?.users) {
            allTeamMembers.push(...leg.levels[levelKey].users);
          }
        }
      }
      
      // Unique team members
      const uniqueTeamMembers = [...new Set(allTeamMembers.map(id => id.toString()))];
      console.log(`   Team members: ${uniqueTeamMembers.length}`);
      
      let userFixed = false;
      
      // ===== FIX: Distribute users to Level 2 and 3 =====
      for (let legIndex = 0; legIndex < user.legs.length; legIndex++) {
        const leg = user.legs[legIndex];
        
        // Get root user of this leg
        const rootUserId = leg.rootUser?.toString();
        
        // Get all users in this leg (excluding root)
        const legUsers = [];
        for (let levelNum = 1; levelNum <= 21; levelNum++) {
          const levelKey = `level${levelNum}`;
          if (leg.levels[levelKey]?.users) {
            legUsers.push(...leg.levels[levelKey].users);
          }
        }
        
        // Current level counts
        const level1Count = leg.levels.level1?.users?.length || 0;
        const level2Count = leg.levels.level2?.users?.length || 0;
        const level3Count = leg.levels.level3?.users?.length || 0;
        
        console.log(`   Leg ${leg.legNumber}: L1=${level1Count}, L2=${level2Count}, L3=${level3Count}`);
        
        // ===== FIX Level 2 =====
        if (level2Count === 0 && level1Count > 3) {
          const level1Users = [...(leg.levels.level1?.users || [])];
          
          if (level1Users.length > 3) {
            // Take users from level 1 and move to level 2
            const usersToMove = level1Users.slice(3, Math.min(6, level1Users.length));
            
            if (usersToMove.length > 0) {
              // Initialize level 2 if needed
              if (!leg.levels.level2) {
                leg.levels.level2 = {
                  users: [],
                  earnings: 0,
                  teamCashback: 0,
                  isUnlocked: true,
                  unlockedAt: new Date(),
                  requiredLevels: []
                };
              }
              
              // Add to level 2
              leg.levels.level2.users = [...usersToMove];
              
              // Remove from level 1 (keep first 3)
              leg.levels.level1.users = level1Users.slice(0, 3);
              
              console.log(`      ✅ Moved ${usersToMove.length} users from L1 to L2`);
              stats.level2Fixed++;
              userFixed = true;
              
              // ===== CREATE MISSED COMMISSION RECORD =====
              const potentialRate = getCommissionRate(2);
              const missedAmount = 1000 * potentialRate; // Assume ₹1000 transaction
              
              if (!user.missedCommissions) user.missedCommissions = [];
              
              user.missedCommissions.push({
                amount: missedAmount,
                level: 2,
                legNumber: leg.legNumber,
                reason: "Level 2 was empty - users redistributed from Level 1",
                sourceUserId: usersToMove[0],
                sourceAmount: 1000,
                date: new Date(),
                read: false
              });
              
              stats.missedCommissionsAdded++;
              stats.totalMissedAmount += missedAmount;
            }
          }
        }
        
        // ===== FIX Level 3 =====
        if (level3Count === 0 && level2Count > 2) {
          const level2Users = [...(leg.levels.level2?.users || [])];
          
          if (level2Users.length > 2) {
            // Take users from level 2 and move to level 3
            const usersToMove = level2Users.slice(2, Math.min(5, level2Users.length));
            
            if (usersToMove.length > 0) {
              // Initialize level 3 if needed
              if (!leg.levels.level3) {
                leg.levels.level3 = {
                  users: [],
                  earnings: 0,
                  teamCashback: 0,
                  isUnlocked: true,
                  unlockedAt: new Date(),
                  requiredLevels: []
                };
              }
              
              // Add to level 3
              leg.levels.level3.users = [...usersToMove];
              
              // Remove from level 2 (keep first 2)
              leg.levels.level2.users = level2Users.slice(0, 2);
              
              console.log(`      ✅ Moved ${usersToMove.length} users from L2 to L3`);
              stats.level3Fixed++;
              userFixed = true;
              
              // ===== CREATE MISSED COMMISSION RECORD =====
              const potentialRate = getCommissionRate(3);
              const missedAmount = 1000 * potentialRate;
              
              user.missedCommissions.push({
                amount: missedAmount,
                level: 3,
                legNumber: leg.legNumber,
                reason: "Level 3 was empty - users redistributed from Level 2",
                sourceUserId: usersToMove[0],
                sourceAmount: 1000,
                date: new Date(),
                read: false
              });
              
              stats.missedCommissionsAdded++;
              stats.totalMissedAmount += missedAmount;
            }
          }
        }
        
        // ===== CHECK IF LEVEL 4 CAN BE UNLOCKED NOW =====
        if (leg.levels.level1?.users?.length > 0 &&
            leg.levels.level2?.users?.length > 0 &&
            leg.levels.level3?.users?.length > 0) {
          
          const minDirectsNeeded = getHorizontalRequirements(4); // 2 directs needed
          
          if (user.legs.length >= minDirectsNeeded && !leg.levels.level4?.isUnlocked) {
            // Unlock level 4
            if (!leg.levels.level4) {
              leg.levels.level4 = {
                users: [],
                earnings: 0,
                teamCashback: 0,
                isUnlocked: true,
                unlockedAt: new Date(),
                requiredLevels: [1, 2, 3]
              };
            } else {
              leg.levels.level4.isUnlocked = true;
              leg.levels.level4.unlockedAt = new Date();
              leg.levels.level4.requiredLevels = [1, 2, 3];
            }
            
            console.log(`      🔓 Leg ${leg.legNumber} Level 4 UNLOCKED!`);
            stats.level4Unlocked++;
            userFixed = true;
          }
        }
      }
      
      // ===== STEP 2: Create Missing Legs (3-level rule) =====
      // Calculate how many legs should exist based on highest level completed
      let maxLevelCompleted = 0;
      for (const leg of user.legs) {
        for (let levelNum = 1; levelNum <= 21; levelNum++) {
          if (leg.levels[`level${levelNum}`]?.users?.length > 0) {
            maxLevelCompleted = Math.max(maxLevelCompleted, levelNum);
          }
        }
      }
      
      // Every 3 levels = 1 new leg required (starting from 5 initial legs)
      // Initial legs = 5, then +1 for every 3 levels completed
      const requiredLegs = 5 + Math.floor(maxLevelCompleted / 3);
      
      if (user.legs.length < requiredLegs) {
        console.log(`   📊 Need ${requiredLegs} legs (have ${user.legs.length}) - Creating missing legs...`);
        
        // Create missing legs
        for (let i = user.legs.length; i < requiredLegs; i++) {
          const legNumber = i + 1;
          
          // Create new leg with empty levels
          const levels = initializeLevels();
          
          // IMPORTANT: New leg needs a rootUser - can't be null
          // Since this is a future leg, we'll set rootUser to null for now
          // But we need to handle validation - let's use a temporary approach
          
          // Create new leg object WITHOUT saving yet
          const newLeg = {
            legNumber,
            rootUser: null, // This will be set when someone actually joins
            joinedAt: new Date(),
            isActive: true,
            levels,
            stats: {
              totalUsers: 0,
              totalEarnings: 0,
              totalTeamCashback: 0,
              lastActivity: new Date()
            }
          };
          
          // Instead of pushing directly, we'll use the schema's method if available
          // Or we'll create a placeholder leg that will be filled later
          
          // For now, let's check if we can use the createNewLeg method
          if (typeof user.createNewLeg === 'function') {
            // This will create a proper leg with a rootUser
            // But we don't have a rootUser yet, so we need a different approach
            console.log(`      ⚠️ Cannot create Leg ${legNumber} without rootUser`);
          } else {
            // Since rootUser is required, we need to skip creating legs without rootUser
            // These legs will be created naturally when new referrals join
            console.log(`      ⚠️ Skipping Leg ${legNumber} creation - needs rootUser when someone joins`);
          }
        }
        
        // Alternative: Don't create legs without rootUser
        // Instead, update the teamStats.activeLegs to reflect the required count
        user.teamStats.activeLegs = user.legs.length;
        console.log(`   ℹ️ Will create new legs when new direct referrals join`);
      }
      
      if (userFixed) {
        stats.usersWithEmptyLevels++;
        await user.save();
        console.log(`   ✅ User fixed!`);
      } else {
        console.log(`   ✅ No fixes needed`);
      }
    }
    
    // ===== STEP 3: Update teamStats for all users =====
    console.log("\n========================================");
    console.log("📊 UPDATING TEAM STATS...");
    
    for (const user of allUsers) {
      if (!user.legs) continue;
      
      // Count total users in all legs
      let totalUsers = 0;
      for (const leg of user.legs) {
        for (let levelNum = 1; levelNum <= 21; levelNum++) {
          totalUsers += leg.levels[`level${levelNum}`]?.users?.length || 0;
        }
      }
      
      user.teamStats = {
        totalTeam: totalUsers,
        activeLegs: user.legs.length,
        lastUpdated: new Date()
      };
      
      await user.save();
    }
    
    console.log("✅ Team stats updated");
    
    // ===== FINAL SUMMARY =====
    console.log("\n========================================");
    console.log("📊 FIX COMPLETE - SUMMARY");
    console.log("========================================");
    console.log(`✅ Users processed: ${stats.processed}`);
    console.log(`✅ Users with fixes: ${stats.usersWithEmptyLevels}`);
    console.log(`📊 Level 2 fixed: ${stats.level2Fixed} legs`);
    console.log(`📊 Level 3 fixed: ${stats.level3Fixed} legs`);
    console.log(`🔓 Level 4 unlocked: ${stats.level4Unlocked} legs`);
    console.log(`💰 Missed commissions added: ${stats.missedCommissionsAdded}`);
    console.log(`💰 Total missed amount: ₹${stats.totalMissedAmount.toFixed(2)}`);
    console.log("========================================");
    console.log("\n⚠️ NOTE: New legs will be created automatically when new direct referrals join");
    console.log("   The 3-level rule requires 5 initial legs + 1 per 3 levels completed");
    console.log("========================================");
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};