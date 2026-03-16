// fixLegUnlocking.js
const mongoose = require('mongoose');
require('dotenv').config();

// तुमचं User model import करा
const User = require('./src/models/User');

// MongoDB URL check
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://cpaylink11:cpaylink11@cluster0.zdbgyfs.mongodb.net/cpaylink?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
  

}).then(() => {
  console.log('✅ MongoDB Connected Successfully');
  fixExistingUsersLegs();
}).catch(err => {
  console.error('❌ MongoDB Connection Error:', err);
  process.exit(1);
});

/**
 * ============================================
 * DYNAMIC LEGS UNLOCKING LOGIC
 * ============================================
 * 
 * प्रत्येक direct referral साठी एक नवीन leg तयार होते.
 * Leg unlocking नाही, तर LEVEL UNLOCKING आहे.
 * 
 * Level Unlocking Rules:
 * - Levels 1-3: Always unlocked in all legs
 * - Level 4: Unlocked when levels 1,2,3 have at least 1 user each in that leg
 * - Level 5: Unlocked when levels 2,3,4 have at least 1 user each
 * - Level 6: Unlocked when levels 3,4,5 have at least 1 user each
 * - आणि असेच प्रत्येक level साठी...
 */

// Fix script function for DYNAMIC LEGS
const fixExistingUsersLegs = async () => {
  try {
    console.log("\n🔍 Starting Dynamic Legs Fix Script...");
    console.log("========================================");
    
    // सगळे users मिळवा
    const allUsers = await User.find({});
    console.log(`Total users found: ${allUsers.length}`);
    
    let stats = {
      totalUsersProcessed: 0,
      usersWithLegsFixed: 0,
      legsAdded: 0,
      levelsUnlocked: 0,
      errors: 0
    };
    
    for (const user of allUsers) {
      try {
        console.log(`\n👤 Processing User: ${user.userId || user._id}`);
        let userChanged = false;
        
        // ===== STEP 1: Check if user has legs array, if not initialize =====
        if (!user.legs || !Array.isArray(user.legs)) {
          console.log(`   ⚠️ No legs array found, initializing...`);
          user.legs = [];
          user.directReferralsCount = 0;
          user.teamStats = user.teamStats || { totalTeam: 0, activeLegs: 0, lastUpdated: new Date() };
          user.earningsByLevel = user.earningsByLevel || {};
          user.totalEarnings = user.totalEarnings || 0;
          userChanged = true;
        }
        
        // ===== STEP 2: Get direct referrals from old structure =====
        // Old schema मध्ये referralTree.level1 होते, ते आता legs मध्ये convert करा
        const oldDirectReferrals = user.referralTree?.level1 || [];
        const oldDirectReferralsCount = oldDirectReferrals.length;
        
        console.log(`   Old direct referrals: ${oldDirectReferralsCount}`);
        console.log(`   Current legs count: ${user.legs.length}`);
        
        // ===== STEP 3: Create legs for each direct referral =====
        if (oldDirectReferralsCount > 0 && user.legs.length === 0) {
          console.log(`   🔄 Converting old direct referrals to legs...`);
          
          for (let i = 0; i < oldDirectReferrals.length; i++) {
            const referralId = oldDirectReferrals[i];
            
            // Initialize level structure for this leg
            const levels = {};
            for (let levelNum = 1; levelNum <= 21; levelNum++) {
              levels[`level${levelNum}`] = {
                users: levelNum === 1 ? [referralId] : [], // Level 1 मध्ये हा user
                earnings: 0,
                teamCashback: 0,
                isUnlocked: levelNum <= 3, // Levels 1-3 always unlocked
                unlockedAt: levelNum <= 3 ? new Date() : null,
                requiredLevels: []
              };
            }
            
            // Create new leg
            const newLeg = {
              legNumber: i + 1,
              rootUser: referralId,
              joinedAt: new Date(),
              isActive: true,
              levels: levels,
              stats: {
                totalUsers: 1,
                totalEarnings: 0,
                totalTeamCashback: 0,
                lastActivity: new Date()
              }
            };
            
            user.legs.push(newLeg);
            stats.legsAdded++;
            userChanged = true;
            
            console.log(`   ✅ Created Leg ${i+1} for referral ${referralId}`);
          }
          
          user.directReferralsCount = oldDirectReferralsCount;
          user.teamStats.activeLegs = oldDirectReferralsCount;
        }
        
        // ===== STEP 4: Check and fix level unlocking for each leg =====
        if (user.legs.length > 0) {
          console.log(`   🔍 Checking level unlocking for ${user.legs.length} legs...`);
          
          for (let legIndex = 0; legIndex < user.legs.length; legIndex++) {
            const leg = user.legs[legIndex];
            
            // Level unlock requirements (3-level rule)
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
            
            for (let levelNum = 4; levelNum <= 21; levelNum++) {
              const levelKey = `level${levelNum}`;
              const level = leg.levels[levelKey];
              
              if (!level) {
                // Initialize missing level
                leg.levels[levelKey] = {
                  users: [],
                  earnings: 0,
                  teamCashback: 0,
                  isUnlocked: false,
                  unlockedAt: null,
                  requiredLevels: requirements[levelNum] || []
                };
                userChanged = true;
                continue;
              }
              
              // Check if this level should be unlocked
              const required = requirements[levelNum];
              let shouldBeUnlocked = true;
              
              for (const reqLevel of required) {
                const reqLevelKey = `level${reqLevel}`;
                const reqLevelData = leg.levels[reqLevelKey];
                
                // If required level doesn't exist or has no users
                if (!reqLevelData || reqLevelData.users.length === 0) {
                  shouldBeUnlocked = false;
                  break;
                }
              }
              
              // Fix unlocking if needed
              if (shouldBeUnlocked && !level.isUnlocked) {
                level.isUnlocked = true;
                level.unlockedAt = new Date();
                level.requiredLevels = required;
                userChanged = true;
                stats.levelsUnlocked++;
                console.log(`   🔓 Leg ${leg.legNumber} - Level ${levelNum} unlocked!`);
              } else if (!shouldBeUnlocked && level.isUnlocked && levelNum > 3) {
                // Levels 1-3 should always be unlocked
                level.isUnlocked = false;
                level.unlockedAt = null;
                userChanged = true;
                console.log(`   🔒 Leg ${leg.legNumber} - Level ${levelNum} locked (missing required levels)`);
              }
            }
          }
        }
        
        // ===== STEP 5: Remove old fields if they exist =====
        if (user.legsUnlocked) {
          console.log(`   🗑️ Removing old legsUnlocked object`);
          user.legsUnlocked = undefined;
          userChanged = true;
        }
        
        if (user.referralTree) {
          console.log(`   🗑️ Removing old referralTree object`);
          user.referralTree = undefined;
          userChanged = true;
        }
        
        if (user.referralRates) {
          console.log(`   🔄 Keeping referralRates but renaming to commissionRates`);
          if (!user.commissionRates) {
            user.commissionRates = user.referralRates;
          }
          user.referralRates = undefined;
          userChanged = true;
        }
        
        if (user.referralEarnings) {
          console.log(`   🔄 Converting referralEarnings to earningsByLevel`);
          if (!user.earningsByLevel) {
            user.earningsByLevel = {};
            for (let level = 1; level <= 21; level++) {
              user.earningsByLevel[`level${level}`] = user.referralEarnings[`level${level}`] || 0;
            }
            user.totalEarnings = user.referralEarnings.total || 0;
          }
          user.referralEarnings = undefined;
          userChanged = true;
        }
        
        // ===== STEP 6: Calculate team totals =====
        if (user.legs.length > 0) {
          let totalTeam = 0;
          for (const leg of user.legs) {
            totalTeam += leg.stats?.totalUsers || 0;
          }
          user.teamStats.totalTeam = totalTeam;
          user.teamStats.lastUpdated = new Date();
        }
        
        // ===== STEP 7: Save user if changes made =====
        if (userChanged) {
          await user.save();
          stats.usersWithLegsFixed++;
          console.log(`   💾 Saved changes for ${user.userId || user._id}`);
          console.log(`   📊 Now has ${user.legs.length} legs`);
        } else {
          console.log(`   ✅ No changes needed`);
        }
        
        stats.totalUsersProcessed++;
        
      } catch (userError) {
        console.error(`   ❌ Error processing user ${user._id}:`, userError.message);
        stats.errors++;
      }
    }
    
    console.log("\n========================================");
    console.log("📊 FIX SUMMARY:");
    console.log("========================================");
    console.log(`✅ Total users processed: ${stats.totalUsersProcessed}`);
    console.log(`✅ Users with fixes applied: ${stats.usersWithLegsFixed}`);
    console.log(`✅ New legs added: ${stats.legsAdded}`);
    console.log(`✅ Levels unlocked: ${stats.levelsUnlocked}`);
    console.log(`❌ Errors encountered: ${stats.errors}`);
    console.log("========================================");
    
    console.log("\n✅ Fix script completed successfully!");
    
    // MongoDB connection close करा
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error in fix script:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

/**
 * Helper function to check if a level should be unlocked
 */
function shouldLevelBeUnlocked(leg, levelNum) {
  if (levelNum <= 3) return true; // Levels 1-3 always unlocked
  
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
  
  const required = requirements[levelNum] || [];
  for (const reqLevel of required) {
    const reqLevelKey = `level${reqLevel}`;
    if (!leg.levels[reqLevelKey] || leg.levels[reqLevelKey].users.length === 0) {
      return false;
    }
  }
  
  return true;
}