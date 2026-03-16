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
      fixed: 0
    };
    
    for (const user of allUsers) {
      console.log(`\n👤 User: ${user.userId || user._id.toString().slice(-6)}`);
      
      // Check if user has old schema
      const hasOldSchema = user.referralTree || user.legsUnlocked;
      const hasNewSchema = user.legs && Array.isArray(user.legs);
      
      if (hasOldSchema) {
        stats.usersWithOldSchema++;
        console.log(`   ⚠️ Has OLD schema`);
        
        // Get direct referrals from old structure
        const directReferrals = user.referralTree?.level1 || [];
        console.log(`   📊 Direct referrals: ${directReferrals.length}`);
        
        // Create legs if there are direct referrals
        if (directReferrals.length > 0 && (!hasNewSchema || user.legs.length === 0)) {
          console.log(`   🔄 Creating ${directReferrals.length} legs...`);
          
          user.legs = [];
          user.directReferralsCount = directReferrals.length;
          user.commissionRates = user.commissionRates || user.referralRates || {};
          user.earningsByLevel = user.earningsByLevel || {};
          user.totalEarnings = user.totalEarnings || 0;
          user.teamStats = user.teamStats || { totalTeam: 0, activeLegs: 0, lastUpdated: new Date() };
          
          // Create leg for each direct referral
          for (let i = 0; i < directReferrals.length; i++) {
            const referralId = directReferrals[i];
            
            // Initialize levels
            const levels = {};
            for (let levelNum = 1; levelNum <= 21; levelNum++) {
              levels[`level${levelNum}`] = {
                users: levelNum === 1 ? [referralId] : [],
                earnings: 0,
                teamCashback: 0,
                isUnlocked: levelNum <= 3,
                unlockedAt: levelNum <= 3 ? new Date() : null,
                requiredLevels: []
              };
            }
            
            // Create leg
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
            stats.legsCreated++;
          }
          
          user.teamStats.activeLegs = directReferrals.length;
          
          // Remove old fields
          user.referralTree = undefined;
          user.legsUnlocked = undefined;
          user.referralRates = undefined;
          user.referralEarnings = undefined;
          
          await user.save();
          stats.fixed++;
          console.log(`   ✅ Created ${directReferrals.length} legs`);
        } else if (directReferrals.length === 0) {
          // Initialize with empty legs array
          user.legs = user.legs || [];
          user.directReferralsCount = 0;
          user.teamStats = user.teamStats || { totalTeam: 0, activeLegs: 0, lastUpdated: new Date() };
          
          // Remove old fields
          user.referralTree = undefined;
          user.legsUnlocked = undefined;
          
          await user.save();
          console.log(`   ✅ Initialized with empty legs`);
        }
        
      } else if (hasNewSchema) {
        stats.usersWithNewSchema++;
        
        // Check if legs match direct referrals
        const directFromReferredBy = await User.countDocuments({ referredBy: user._id });
        
        console.log(`   ✅ Has NEW schema`);
        console.log(`   📊 Current legs: ${user.legs.length}`);
        console.log(`   📊 Actual direct referrals: ${directFromReferredBy}`);
        
        if (user.legs.length !== directFromReferredBy) {
          stats.usersWithMismatch++;
          console.log(`   ⚠️ Mismatch! Legs: ${user.legs.length}, Actual: ${directFromReferredBy}`);
          
          // Fix legs to match actual referrals
          // Get all actual direct referrals
          const actualDirects = await User.find({ referredBy: user._id }, '_id');
          const actualIds = actualDirects.map(u => u._id);
          
          // Create missing legs
          for (let i = user.legs.length; i < actualIds.length; i++) {
            const referralId = actualIds[i];
            
            const levels = {};
            for (let levelNum = 1; levelNum <= 21; levelNum++) {
              levels[`level${levelNum}`] = {
                users: levelNum === 1 ? [referralId] : [],
                earnings: 0,
                teamCashback: 0,
                isUnlocked: levelNum <= 3,
                unlockedAt: levelNum <= 3 ? new Date() : null,
                requiredLevels: []
              };
            }
            
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
            stats.legsCreated++;
          }
          
          user.directReferralsCount = actualIds.length;
          user.teamStats.activeLegs = actualIds.length;
          
          await user.save();
          console.log(`   ✅ Fixed: Now has ${user.legs.length} legs`);
        }
      }
    }
    
    console.log("\n========================================");
    console.log("📊 FIX SUMMARY:");
    console.log("========================================");
    console.log(`✅ Users with OLD schema fixed: ${stats.fixed}`);
    console.log(`✅ Users with NEW schema: ${stats.usersWithNewSchema}`);
    console.log(`⚠️ Users with mismatch: ${stats.usersWithMismatch}`);
    console.log(`✅ New legs created: ${stats.legsCreated}`);
    console.log("========================================");
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};