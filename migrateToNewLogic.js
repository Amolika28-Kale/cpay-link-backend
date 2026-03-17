// scripts/migrateToNewLogic.js
const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function connectToDatabase() {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://cpaylink11:cpaylink11@cluster0.zdbgyfs.mongodb.net/cpaylink?retryWrites=true&w=majority';
    console.log(`🔌 Connecting to MongoDB: ${mongoURI}`);
    
    await mongoose.connect(mongoURI, {
    
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
}

async function migrateUsersToNewLogic() {
  try {
    console.log('🔄 Starting migration to new logic...');
    
    const connected = await connectToDatabase();
    if (!connected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }
    
    console.log('📊 Fetching users from database...');
    const users = await User.find({}).maxTimeMS(30000);
    console.log(`📊 Found ${users.length} users to process`);
    
    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const user of users) {
      try {
        console.log(`\n--- Processing user: ${user.userId || user._id} ---`);
        console.log(`Direct referrals: ${user.directReferralsCount || 0}`);
        console.log(`Current legs: ${user.legs?.length || 0}`);
        
        if (!user.legs || user.legs.length === 0) {
          console.log(`⏭️ User has no legs, skipping...`);
          skippedCount++;
          continue;
        }
        
        if (user.legs.length !== user.directReferralsCount) {
          console.log(`⚠️ Legs count mismatch: legs=${user.legs.length}, directReferrals=${user.directReferralsCount}`);
          
          if (user.legs.length > user.directReferralsCount) {
            user.legs = user.legs.slice(0, user.directReferralsCount);
            console.log(`✅ Reduced legs to ${user.directReferralsCount}`);
          }
        }
        
        const unlockedLevelsCount = user.directReferralsCount || 0;
        
        if (unlockedLevelsCount === 0) {
          console.log(`ℹ️ User has 0 direct referrals, no levels to unlock`);
        } else {
          console.log(`Unlocking levels 1-${unlockedLevelsCount} in all legs`);
        }
        
        const newlyUnlocked = [];
        
        for (let legIndex = 0; legIndex < user.legs.length; legIndex++) {
          const leg = user.legs[legIndex];
          
          if (!leg.levels) {
            leg.levels = {};
          }
          
          for (let levelNum = 1; levelNum <= 21; levelNum++) {
            const levelKey = `level${levelNum}`;
            
            if (!leg.levels[levelKey]) {
              leg.levels[levelKey] = {
                users: [],
                earnings: 0,
                teamCashback: 0,
                isUnlocked: false,
                unlockedAt: null
              };
            }
            
            const level = leg.levels[levelKey];
            const shouldBeUnlocked = levelNum <= unlockedLevelsCount;
            
            if (shouldBeUnlocked && !level.isUnlocked) {
              level.isUnlocked = true;
              level.unlockedAt = new Date();
              
              if (level.pendingUnlock) delete level.pendingUnlock;
              if (level.requiresDirectReferral) delete level.requiresDirectReferral;
              if (level.requiredLevels) delete level.requiredLevels;
              
              newlyUnlocked.push({
                legNumber: leg.legNumber,
                level: levelNum
              });
              
              console.log(`  ✅ Leg ${leg.legNumber} Level ${levelNum} unlocked`);
            }
            
            if (!shouldBeUnlocked && level.isUnlocked) {
              level.isUnlocked = false;
              level.unlockedAt = null;
              console.log(`  ⚠️ Leg ${leg.legNumber} Level ${levelNum} locked (should not be unlocked)`);
            }
          }
          
          if (!leg.stats) {
            leg.stats = {
              totalUsers: 1,
              totalEarnings: 0,
              totalTeamCashback: 0,
              lastActivity: new Date()
            };
          }
          leg.stats.lastActivity = new Date();
        }
        
        // Clean up old fields
        const oldFields = ['legsUnlocked', 'referralTree', 'referralRates', 'teamCashback', 'missedCommissions'];
        oldFields.forEach(field => {
          if (user[field]) {
            console.log(`🧹 Removing old field: ${field}`);
            user[field] = undefined;
          }
        });
        
        if (!user.teamStats) {
          user.teamStats = {
            totalTeam: 0,
            activeLegs: 0,
            lastUpdated: new Date()
          };
        }
        
        user.teamStats.totalTeam = 0;
        for (const leg of user.legs) {
          for (let levelNum = 1; levelNum <= 21; levelNum++) {
            const levelKey = `level${levelNum}`;
            user.teamStats.totalTeam += leg.levels[levelKey]?.users?.length || 0;
          }
        }
        
        user.teamStats.activeLegs = user.legs.length;
        user.teamStats.lastUpdated = new Date();
        
        if (newlyUnlocked.length > 0 && user.addNotification) {
          const unlocksByLeg = {};
          newlyUnlocked.forEach(u => {
            if (!unlocksByLeg[u.legNumber]) unlocksByLeg[u.legNumber] = [];
            unlocksByLeg[u.legNumber].push(u.level);
          });
          
          for (const [legNum, levels] of Object.entries(unlocksByLeg)) {
            user.addNotification(
              'LEVEL_UNLOCKED',
              `System Update: Levels ${levels.join(', ')} unlocked in Leg ${legNum} based on your ${user.directReferralsCount} direct referrals!`,
              parseInt(legNum),
              levels[0],
              { 
                unlockedLevels: levels, 
                reason: 'System migration to new logic',
                systemUpdate: true
              }
            );
          }
        }
        
        user.markModified('legs');
        user.markModified('teamStats');
        if (user.notifications) user.markModified('notifications');
        
        // ========== IMPORTANT: Save with validation disabled ==========
        await user.save({ validateBeforeSave: false });
        
        updatedCount++;
        
        console.log(`✅ User ${user.userId || user._id} updated successfully`);
        if (unlockedLevelsCount > 0) {
          console.log(`   Now has: ${user.legs.length} legs, levels 1-${unlockedLevelsCount} unlocked in all legs`);
        }
        
      } catch (userError) {
        console.error(`❌ Error updating user ${user.userId || user._id}:`, userError.message);
        console.error(userError.stack);
        errorCount++;
      }
    }
    
    console.log('\n========== MIGRATION COMPLETE ==========');
    console.log(`✅ Updated: ${updatedCount} users`);
    console.log(`⏭️ Skipped: ${skippedCount} users (no legs)`);
    console.log(`❌ Errors: ${errorCount} users`);
    console.log('=========================================');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

migrateUsersToNewLogic().then(() => {
  console.log('✅ Migration script finished successfully');
  process.exit(0);
}).catch(err => {
  console.error('❌ Migration script failed:', err);
  process.exit(1);
});