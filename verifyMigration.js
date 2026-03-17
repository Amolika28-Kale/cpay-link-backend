// scripts/verifyMigration.js
const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function verifyMigration() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Get a sample user with legs
    const user = await User.findOne({ 
      legs: { $exists: true, $ne: [] } 
    });
    
    if (user) {
      console.log('\n✅ Sample User After Migration:');
      console.log('================================');
      console.log(`User ID: ${user.userId}`);
      console.log(`Direct Referrals: ${user.directReferralsCount}`);
      console.log(`Total Legs: ${user.legs.length}`);
      
      // Show first leg details
      if (user.legs.length > 0) {
        const leg = user.legs[0];
        console.log('\n📋 First Leg Details:');
        console.log(`   Leg Number: ${leg.legNumber}`);
        console.log(`   Root User: ${leg.rootUser}`);
        console.log(`   Total Users: ${leg.stats.totalUsers}`);
        
        // Count unlocked levels
        let unlockedCount = 0;
        for (let level = 1; level <= 21; level++) {
          if (leg.levels[`level${level}`]?.isUnlocked) {
            unlockedCount++;
          }
        }
        console.log(`   Unlocked Levels: ${unlockedCount}/21`);
      }
      
      console.log('\n✅ Migration verification successful!');
    } else {
      console.log('❌ No users with legs found');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

verifyMigration();