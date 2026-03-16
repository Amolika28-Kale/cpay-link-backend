// verifyLegUnlocking.js
const mongoose = require('mongoose');
require('dotenv').config();

// तुमच्या project structure प्रमाणे योग्य path द्या
const User = require('./src/models/User');

// MongoDB URI check
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://cpaylink11:cpaylink11@cluster0.zdbgyfs.mongodb.net/cpaylink?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
 
}).then(async () => {
  console.log('✅ MongoDB Connected Successfully');
  await verifyLegUnlocking();
}).catch(err => {
  console.error('❌ MongoDB Connection Error:', err);
  process.exit(1);
});

/**
 * ============================================
 * DYNAMIC LEGS VERIFICATION
 * ============================================
 * 
 * प्रत्येक direct referral साठी एक नवीन leg तयार होते.
 * प्रत्येक leg मध्ये 21 levels असतात.
 * Level unlocking 3-level rule नुसार होते:
 * - Level 4 unlock साठी levels 1,2,3 मध्ये users पाहिजेत
 * - Level 5 unlock साठी levels 2,3,4 मध्ये users पाहिजेत
 * - आणि असेच...
 */

const verifyLegUnlocking = async () => {
  try {
    const users = await User.find({});
    
    console.log("\n📊 DYNAMIC LEGS UNLOCKING STATUS REPORT");
    console.log("========================================");
    console.log(`Total Users: ${users.length}\n`);
    
    // Statistics for new schema
    const stats = {
      totalUsersWithLegs: 0,
      totalLegs: 0,
      usersWithOldSchema: 0,
      levelStats: {},
      legStats: [],
      issues: []
    };
    
    // Initialize level stats for 21 levels
    for (let level = 1; level <= 21; level++) {
      stats.levelStats[`level${level}`] = {
        totalUsersAtLevel: 0,
        accessibleInUsers: 0,
        shouldBeAccessible: 0,
        issues: []
      };
    }
    
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
    
    // Detailed user report
    console.log("🔍 DETAILED USER REPORT:");
    console.log("========================================");
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.userId || user._id.toString().slice(-6)}`);
      
      // Check if user has new schema (legs array) or old schema (legsUnlocked)
      const hasNewSchema = user.legs && Array.isArray(user.legs) && user.legs.length > 0;
      const hasOldSchema = user.legsUnlocked && Object.keys(user.legsUnlocked).length > 0;
      
      if (hasNewSchema) {
        stats.totalUsersWithLegs++;
        stats.totalLegs += user.legs.length;
        
        console.log(`   ✅ Using NEW schema`);
        console.log(`   📊 Direct Referrals (Legs): ${user.legs.length}`);
        
        // Get direct referrals count from legs
        const directCount = user.legs.length;
        
        // Check each level's accessibility
        for (let level = 1; level <= 21; level++) {
          const isAccessible = user.isLevelAccessible ? user.isLevelAccessible(level) : level <= 3;
          
          // Count users at this level across all legs
          let usersAtLevel = 0;
          for (const leg of user.legs) {
            const levelKey = `level${level}`;
            if (leg.levels && leg.levels[levelKey]) {
              usersAtLevel += leg.levels[levelKey].users.length;
            }
          }
          
          stats.levelStats[`level${level}`].totalUsersAtLevel += usersAtLevel;
          
          if (isAccessible) {
            stats.levelStats[`level${level}`].accessibleInUsers++;
          }
          
          // Check if level should be accessible based on direct referrals
          // Levels 1-3 always accessible
          if (level <= 3) {
            stats.levelStats[`level${level}`].shouldBeAccessible++;
            if (!isAccessible) {
              stats.levelStats[`level${level}`].issues.push(user.userId);
              stats.issues.push(`${user.userId}: Level ${level} should be accessible but is not`);
            }
          } else {
            // For levels 4-21, check if required levels have users
            const required = requirements[level] || [];
            let shouldBeAccessible = true;
            
            for (const reqLevel of required) {
              let hasUserInRequiredLevel = false;
              for (const leg of user.legs) {
                const reqLevelKey = `level${reqLevel}`;
                if (leg.levels && leg.levels[reqLevelKey] && leg.levels[reqLevelKey].users.length > 0) {
                  hasUserInRequiredLevel = true;
                  break;
                }
              }
              if (!hasUserInRequiredLevel) {
                shouldBeAccessible = false;
                break;
              }
            }
            
            if (shouldBeAccessible) {
              stats.levelStats[`level${level}`].shouldBeAccessible++;
              if (!isAccessible) {
                stats.levelStats[`level${level}`].issues.push(user.userId);
                stats.issues.push(`${user.userId}: Level ${level} should be accessible but is not`);
              }
            }
          }
        }
        
        // Leg-wise breakdown
        console.log(`   🦵 Legs Breakdown:`);
        for (let i = 0; i < user.legs.length; i++) {
          const leg = user.legs[i];
          console.log(`      Leg ${i+1}: ${leg.stats?.totalUsers || 1} users, Root: ${leg.rootUser?.toString().slice(-6) || 'N/A'}`);
        }
        
      } else if (hasOldSchema) {
        stats.usersWithOldSchema++;
        console.log(`   ⚠️ Using OLD schema (needs migration)`);
        console.log(`   Current legsUnlocked:`, user.legsUnlocked);
        stats.issues.push(`${user.userId}: Still using old schema (legsUnlocked object)`);
      } else {
        console.log(`   ℹ️ No legs data found`);
      }
    }
    
    console.log("\n\n📊 DYNAMIC LEGS SUMMARY");
    console.log("========================================");
    console.log(`✅ Users with NEW schema: ${stats.totalUsersWithLegs}`);
    console.log(`⚠️ Users with OLD schema: ${stats.usersWithOldSchema}`);
    console.log(`📊 Total legs across all users: ${stats.totalLegs}`);
    console.log(`📊 Average legs per user: ${(stats.totalLegs / stats.totalUsersWithLegs || 0).toFixed(2)}`);
    console.log("");
    
    console.log("📊 LEVEL ACCESSIBILITY SUMMARY:");
    console.log("========================================");
    
    for (let level = 1; level <= 21; level++) {
      const levelStat = stats.levelStats[`level${level}`];
      const percentage = stats.totalUsersWithLegs > 0 
        ? ((levelStat.accessibleInUsers / stats.totalUsersWithLegs) * 100).toFixed(1)
        : 0;
      
      console.log(`Level ${level}:`);
      console.log(`   📈 Accessible in: ${levelStat.accessibleInUsers}/${stats.totalUsersWithLegs} users (${percentage}%)`);
      console.log(`   👥 Total users at this level: ${levelStat.totalUsersAtLevel}`);
      console.log(`   ✅ Should be accessible: ${levelStat.shouldBeAccessible}/${stats.totalUsersWithLegs}`);
      
      if (levelStat.issues.length > 0) {
        console.log(`   ❌ Issues: ${levelStat.issues.length}`);
        if (levelStat.issues.length <= 5) {
          console.log(`      Users: ${levelStat.issues.join(', ')}`);
        } else {
          console.log(`      First 5: ${levelStat.issues.slice(0, 5).join(', ')}...`);
        }
      }
      console.log("");
    }
    
    console.log("========================================");
    
    // Overall status
    if (stats.usersWithOldSchema > 0) {
      console.log(`\n⚠️ Found ${stats.usersWithOldSchema} users still using old schema.`);
      console.log("Run fixLegUnlocking.js to migrate these users.");
    }
    
    const totalIssues = Object.values(stats.levelStats).reduce((sum, stat) => sum + stat.issues.length, 0);
    
    if (totalIssues === 0 && stats.usersWithOldSchema === 0) {
      console.log("\n✅ All legs are correctly unlocked based on 3-level rule!");
    } else {
      console.log(`\n⚠️ Found ${totalIssues} level unlocking issues that need fixing.`);
      if (stats.usersWithOldSchema > 0) {
        console.log(`⚠️ Also found ${stats.usersWithOldSchema} users with old schema.`);
      }
      console.log("Run fixLegUnlocking.js to fix these issues.");
    }
    
    // Leg-wise statistics
    console.log("\n\n📊 LEG-WISE STATISTICS:");
    console.log("========================================");
    
    // Collect leg data
    const legData = [];
    for (const user of users) {
      if (user.legs && Array.isArray(user.legs)) {
        for (const leg of user.legs) {
          legData.push({
            legNumber: leg.legNumber,
            totalUsers: leg.stats?.totalUsers || 1,
            levelsUnlocked: Object.values(leg.levels || {}).filter(l => l.isUnlocked).length
          });
        }
      }
    }
    
    if (legData.length > 0) {
      const avgUsersPerLeg = legData.reduce((sum, leg) => sum + leg.totalUsers, 0) / legData.length;
      const avgLevelsUnlocked = legData.reduce((sum, leg) => sum + leg.levelsUnlocked, 0) / legData.length;
      
      console.log(`📊 Total legs analyzed: ${legData.length}`);
      console.log(`📈 Average users per leg: ${avgUsersPerLeg.toFixed(2)}`);
      console.log(`🔓 Average levels unlocked per leg: ${avgLevelsUnlocked.toFixed(2)}`);
      
      // Distribution of legs
      const legDistribution = {};
      legData.forEach(leg => {
        const range = leg.totalUsers <= 1 ? '1' :
                      leg.totalUsers <= 5 ? '2-5' :
                      leg.totalUsers <= 10 ? '6-10' :
                      leg.totalUsers <= 20 ? '11-20' : '20+';
        legDistribution[range] = (legDistribution[range] || 0) + 1;
      });
      
      console.log("\n📊 Leg size distribution:");
      Object.entries(legDistribution).forEach(([range, count]) => {
        console.log(`   ${range} users: ${count} legs (${((count/legData.length)*100).toFixed(1)}%)`);
      });
    }
    
    mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error in verification:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};