// fixDirectReferralsToLegs.js
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://cpaylink11:cpaylink11@cluster0.zdbgyfs.mongodb.net/cpaylink?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
 
}).then(async () => {
  console.log('✅ MongoDB Connected Successfully');
  await fixDirectReferrals();
}).catch(err => {
  console.error('❌ MongoDB Connection Error:', err);
  process.exit(1);
});

/**
 * Helper function to get required previous levels for a given level
 */
function getRequiredLevels(levelNum) {
  const requirements = {
    4: [1, 2, 3],
    5: [2, 3, 4],
    6: [3, 4, 5],
    7: [4, 5, 6],
    8: [5, 6, 7],
    9: [6, 7, 8],
    10: [7, 8, 9],
    11: [8, 9, 10],
    12: [9, 10, 11],
    13: [10, 11, 12],
    14: [11, 12, 13],
    15: [12, 13, 14],
    16: [13, 14, 15],
    17: [14, 15, 16],
    18: [15, 16, 17],
    19: [16, 17, 18],
    20: [17, 18, 19],
    21: [18, 19, 20]
  };
  return requirements[levelNum] || [];
}

/**
 * Get horizontal requirements for levels
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
 * Initialize level structure for a leg
 */
function initializeLevels(referralId) {
  const levels = {};
  for (let levelNum = 1; levelNum <= 21; levelNum++) {
    levels[`level${levelNum}`] = {
      users: levelNum === 1 ? [referralId] : [],
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
 * Check if a leg should be active based on previous leg completion
 * INDEPENDENT LEGS - सगळ्या legs active असायला हव्यात
 */
function shouldLegBeActive(legIndex) {
  // सगळ्या legs active असायला हव्यात - independent working
  return true;
}

const fixDirectReferrals = async () => {
  try {
    console.log("\n🔍 Fixing Direct Referrals to Legs...");
    console.log("========================================");
    
    // सगळे users मिळवा
    const allUsers = await User.find({});
    console.log(`Total users found: ${allUsers.length}\n`);
    
    let stats = {
      usersWithOldSchema: 0,
      usersWithNewSchema: 0,
      usersWithMismatch: 0,
      legsCreated: 0,
      fixed: 0,
      totalDirects: 0,
      usersProcessed: 0,
      levelUnlockFixes: 0,
      legActivationFixes: 0,
      missedCommissionsMigrated: 0
    };
    
    for (const user of allUsers) {
      stats.usersProcessed++;
      console.log(`\n👤 [${stats.usersProcessed}/${allUsers.length}] User: ${user.userId || user._id.toString().slice(-6)}`);
      
      // Check if user has old schema
      const hasOldSchema = user.referralTree || user.legsUnlocked;
      const hasNewSchema = user.legs && Array.isArray(user.legs);
      
      if (hasOldSchema) {
        stats.usersWithOldSchema++;
        console.log(`   ⚠️ Has OLD schema`);
        
        // Get direct referrals from old structure
        const directReferrals = user.referralTree?.level1 || [];
        stats.totalDirects += directReferrals.length;
        console.log(`   📊 Direct referrals: ${directReferrals.length}`);
        
        // Create legs if there are direct referrals
        if (directReferrals.length > 0) {
          console.log(`   🔄 Creating ${directReferrals.length} legs...`);
          
          // Initialize arrays if not present
          user.legs = user.legs || [];
          user.directReferralsCount = directReferrals.length;
          
          // Set commission rates
          if (!user.commissionRates && user.referralRates) {
            user.commissionRates = user.referralRates;
          } else if (!user.commissionRates) {
            user.commissionRates = {
              level1: 0.30, level2: 0.15, level3: 0.10, level4: 0.05, level5: 0.30,
              level6: 0.03, level7: 0.04, level8: 0.03, level9: 0.03, level10: 0.30,
              level11: 0.03, level12: 0.03, level13: 0.03, level14: 0.03, level15: 0.03,
              level16: 0.05, level17: 0.10, level18: 0.15, level19: 0.30, level20: 0.30,
              level21: 0.63
            };
          }
          
          // Initialize earnings
          user.earningsByLevel = user.earningsByLevel || {};
          for (let level = 1; level <= 21; level++) {
            if (!user.earningsByLevel[`level${level}`]) {
              user.earningsByLevel[`level${level}`] = 0;
            }
          }
          
          user.totalEarnings = user.totalEarnings || 0;
          
          // Initialize missed commissions array
          user.missedCommissions = user.missedCommissions || [];
          
          // Initialize team stats
          user.teamStats = user.teamStats || { 
            totalTeam: directReferrals.length, 
            activeLegs: directReferrals.length, // सगळ्या legs active
            lastUpdated: new Date() 
          };
          
          // Create leg for each direct referral - सगळ्या legs active
          for (let i = 0; i < directReferrals.length; i++) {
            const referralId = directReferrals[i];
            
            // Initialize levels
            const levels = initializeLevels(referralId);
            
            // Create leg - सगळ्या legs active असतील
            const newLeg = {
              legNumber: i + 1,
              rootUser: referralId,
              joinedAt: new Date(),
              isActive: true, // सगळ्या legs active
              levels: levels,
              stats: {
                totalUsers: 1,
                totalEarnings: 0,
                totalTeamCashback: 0,
                lastActivity: new Date()
              }
            };
            
            user.legs.push(newLeg);
            stats.legsCreated++;
            console.log(`   ✅ Created Leg ${i+1} (ACTIVE)`);
          }
          
          user.teamStats.activeLegs = directReferrals.length; // सगळ्या legs active
          
          // Remove old fields
          user.referralTree = undefined;
          user.legsUnlocked = undefined;
          user.referralRates = undefined;
          user.referralEarnings = undefined;
          user.teamCashback = undefined;
          
          await user.save();
          stats.fixed++;
          console.log(`   ✅ Created ${directReferrals.length} legs (All ACTIVE)`);
          
        } else {
          // No direct referrals
          console.log(`   ℹ️ No direct referrals, initializing with empty legs`);
          
          user.legs = user.legs || [];
          user.directReferralsCount = 0;
          user.missedCommissions = user.missedCommissions || [];
          user.teamStats = user.teamStats || { totalTeam: 0, activeLegs: 0, lastUpdated: new Date() };
          user.commissionRates = user.commissionRates || user.referralRates || {
            level1: 0.30, level2: 0.15, level3: 0.10, level4: 0.05, level5: 0.30,
            level6: 0.03, level7: 0.04, level8: 0.03, level9: 0.03, level10: 0.30,
            level11: 0.03, level12: 0.03, level13: 0.03, level14: 0.03, level15: 0.03,
            level16: 0.05, level17: 0.10, level18: 0.15, level19: 0.30, level20: 0.30,
            level21: 0.63
          };
          user.earningsByLevel = user.earningsByLevel || {};
          user.totalEarnings = user.totalEarnings || 0;
          
          // Remove old fields
          user.referralTree = undefined;
          user.legsUnlocked = undefined;
          user.referralRates = undefined;
          user.referralEarnings = undefined;
          user.teamCashback = undefined;
          
          await user.save();
          console.log(`   ✅ Initialized with empty legs`);
        }
        
      } else if (hasNewSchema) {
        stats.usersWithNewSchema++;
        
        // Check if legs match actual direct referrals
        const actualDirects = await User.find({ referredBy: user._id }, '_id');
        const actualIds = actualDirects.map(u => u._id);
        
        console.log(`   ✅ Has NEW schema`);
        console.log(`   📊 Current legs in DB: ${user.legs.length}`);
        console.log(`   📊 Actual direct referrals: ${actualIds.length}`);
        
        // ===== FIX: Update direct referrals count =====
        if (user.directReferralsCount !== actualIds.length) {
          user.directReferralsCount = actualIds.length;
          console.log(`   📊 Updated directReferralsCount: ${actualIds.length}`);
        }
        
        // ===== FIX: Update teamStats.totalTeam =====
        if (user.teamStats.totalTeam !== actualIds.length) {
          user.teamStats.totalTeam = actualIds.length;
          console.log(`   📊 Updated teamStats.totalTeam: ${actualIds.length}`);
        }
        
        // ===== FIX: Initialize missedCommissions if not present =====
        if (!user.missedCommissions) {
          user.missedCommissions = [];
          console.log(`   📊 Initialized missedCommissions array`);
        }
        
        // ===== FIX: Ensure all legs are ACTIVE (independent working) =====
        let legActivationFixed = false;
        
        for (let legIndex = 0; legIndex < user.legs.length; legIndex++) {
          const leg = user.legs[legIndex];
          
          // सगळ्या legs active असायला हव्यात
          if (!leg.isActive) {
            leg.isActive = true;
            legActivationFixed = true;
            stats.legActivationFixes++;
            console.log(`   ✅ Activated Leg ${leg.legNumber}`);
          }
        }
        
        // ===== FIX: Update teamStats.activeLegs =====
        const activeLegsCount = user.legs.length; // सगळ्या legs active
        if (user.teamStats.activeLegs !== activeLegsCount) {
          user.teamStats.activeLegs = activeLegsCount;
          console.log(`   📊 Updated teamStats.activeLegs: ${activeLegsCount}`);
        }
        
        // ===== FIX: Check level unlocking based on horizontal requirements =====
        const directCount = actualIds.length;
        let levelUnlockFixed = false;
        
        for (let legIndex = 0; legIndex < user.legs.length; legIndex++) {
          const leg = user.legs[legIndex];
          
          // Check levels 4-21
          for (let levelNum = 4; levelNum <= 21; levelNum++) {
            const levelKey = `level${levelNum}`;
            const level = leg.levels[levelKey];
            
            if (!level) continue;
            
            // Check horizontal requirement (min direct referrals needed)
            const minDirectsNeeded = getHorizontalRequirements(levelNum);
            
            // Check vertical requirement (previous levels have users)
            const reqLevels = getRequiredLevels(levelNum);
            let verticalMet = true;
            
            for (const reqLevel of reqLevels) {
              const reqLevelKey = `level${reqLevel}`;
              if (!leg.levels[reqLevelKey] || leg.levels[reqLevelKey].users.length === 0) {
                verticalMet = false;
                break;
              }
            }
            
            const shouldBeUnlocked = (directCount >= minDirectsNeeded) && verticalMet;
            
            if (shouldBeUnlocked && !level.isUnlocked) {
              level.isUnlocked = true;
              level.unlockedAt = new Date();
              level.requiredLevels = reqLevels;
              levelUnlockFixed = true;
              stats.levelUnlockFixes++;
              console.log(`   🔓 Leg ${leg.legNumber} Level ${levelNum} unlocked (need ${minDirectsNeeded} directs, have ${directCount})`);
            } else if (!shouldBeUnlocked && level.isUnlocked && levelNum > 3) {
              level.isUnlocked = false;
              level.unlockedAt = null;
              levelUnlockFixed = true;
              stats.levelUnlockFixes++;
              
              let reason = directCount < minDirectsNeeded 
                ? `needs ${minDirectsNeeded} directs` 
                : `previous levels empty`;
              console.log(`   🔒 Leg ${leg.legNumber} Level ${levelNum} locked (${reason})`);
            }
          }
        }
        
        // ===== FIX: Create missing legs =====
        if (user.legs.length !== actualIds.length) {
          stats.usersWithMismatch++;
          console.log(`   ⚠️ Mismatch! Fixing...`);
          
          // Update team stats
          user.teamStats.totalTeam = actualIds.length;
          
          // Create missing legs
          if (actualIds.length > user.legs.length) {
            for (let i = user.legs.length; i < actualIds.length; i++) {
              const referralId = actualIds[i];
              
              // Initialize levels
              const levels = initializeLevels(referralId);
              
              // New legs are ACTIVE (independent working)
              const newLeg = {
                legNumber: i + 1,
                rootUser: referralId,
                joinedAt: new Date(),
                isActive: true, // सगळ्या legs active
                levels: levels,
                stats: {
                  totalUsers: 1,
                  totalEarnings: 0,
                  totalTeamCashback: 0,
                  lastActivity: new Date()
                }
              };
              
              user.legs.push(newLeg);
              stats.legsCreated++;
              console.log(`   ✅ Created missing Leg ${i+1} (ACTIVE)`);
            }
          }
          
          // Update active legs count
          user.teamStats.activeLegs = user.legs.length; // सगळ्या legs active
          
          await user.save();
          console.log(`   ✅ Fixed: Now has ${user.legs.length} legs, all ACTIVE`);
          
        } else if (levelUnlockFixed || legActivationFixed) {
          await user.save();
          console.log(`   ✅ Fixed level unlocking based on ${directCount} direct referrals`);
        } else {
          console.log(`   ✅ Correct: ${user.legs.length} legs match ${actualIds.length} direct referrals`);
        }
        
      } else {
        console.log(`   ℹ️ No schema found, initializing new schema`);
        
        // Initialize new schema with all required fields
        user.legs = [];
        user.directReferralsCount = 0;
        user.missedCommissions = [];
        user.commissionRates = {
          level1: 0.30, level2: 0.15, level3: 0.10, level4: 0.05, level5: 0.30,
          level6: 0.03, level7: 0.04, level8: 0.03, level9: 0.03, level10: 0.30,
          level11: 0.03, level12: 0.03, level13: 0.03, level14: 0.03, level15: 0.03,
          level16: 0.05, level17: 0.10, level18: 0.15, level19: 0.30, level20: 0.30,
          level21: 0.63
        };
        user.earningsByLevel = {};
        for (let level = 1; level <= 21; level++) {
          user.earningsByLevel[`level${level}`] = 0;
        }
        user.totalEarnings = 0;
        user.teamStats = { totalTeam: 0, activeLegs: 0, lastUpdated: new Date() };
        
        await user.save();
        console.log(`   ✅ Initialized with new schema`);
      }
    }
    
    console.log("\n========================================");
    console.log("📊 FIX SUMMARY:");
    console.log("========================================");
    console.log(`📌 Total users processed: ${stats.usersProcessed}`);
    console.log(`✅ Users with OLD schema fixed: ${stats.fixed}`);
    console.log(`✅ Users with NEW schema: ${stats.usersWithNewSchema}`);
    console.log(`⚠️ Users with mismatch: ${stats.usersWithMismatch}`);
    console.log(`✅ New legs created: ${stats.legsCreated}`);
    console.log(`🔓 Level unlock fixes: ${stats.levelUnlockFixes}`);
    console.log(`🔌 Leg activation fixes: ${stats.legActivationFixes}`);
    console.log(`📊 Total direct referrals across all users: ${stats.totalDirects}`);
    console.log("========================================");
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};