// migrateToNewStructure.js (in root directory)
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables from .env file in current directory
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import User model
const User = require('./src/models/User');

// Debug: Check if .env loaded
console.log('🔧 Environment check:');
console.log(`   Current directory: ${__dirname}`);
console.log(`   .env path: ${path.join(__dirname, '.env')}`);
console.log(`   MONGO_URI: ${process.env.MONGO_URI ? '✅ Found' : '❌ Not found'}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);

// If MONGO_URI not found, try to read from .env file directly
if (!process.env.MONGO_URI) {
  console.log('⚠️ MONGO_URI not found in environment, checking .env file...');
  
  const fs = require('fs');
  try {
    const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    const match = envContent.match(/MONGO_URI=(.+)/);
    if (match) {
      process.env.MONGO_URI = match[1].trim();
      console.log('✅ Found MONGO_URI in .env file');
    } else {
      console.log('❌ MONGO_URI not found in .env file');
    }
  } catch (err) {
    console.log('❌ Could not read .env file:', err.message);
  }
}

// If still not found, prompt user
if (!process.env.MONGO_URI) {
  console.error('\n❌ MONGO_URI is not set!');
  console.log('\nPlease create a .env file in the current directory with:');
  console.log('MONGO_URI=mongodb://localhost:27017/cpaylink');
  console.log('\nOr for MongoDB Atlas:');
  console.log('MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/cpaylink');
  process.exit(1);
}

async function migrateUsersToNewStructure() {
  console.log('🚀 Starting migration to new legs-based structure...');
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Get all users
    const users = await User.find({}).session(session);
    console.log(`📊 Found ${users.length} users to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        console.log(`\n🔍 Processing user: ${user.userId} (${user._id})`);
        
        // Skip if user already has legs array (already migrated)
        if (user.legs && user.legs.length > 0) {
          console.log(`   ⏭️ User ${user.userId} already has legs, skipping...`);
          skippedCount++;
          continue;
        }

        // Initialize legs array if not present
        if (!user.legs) {
          user.legs = [];
        }

        // ===== STEP 1: Migrate direct referrals to legs =====
        // Check old referralTree structure
        const oldReferralTree = user.referralTree || {};
        const directReferrals = oldReferralTree.level1 || [];
        
        console.log(`   📋 Found ${directReferrals.length} direct referrals`);

        // For each direct referral, create a new leg
        for (let i = 0; i < directReferrals.length; i++) {
          const referralId = directReferrals[i];
          const legNumber = i + 1;
          
          // Check if leg already exists
          const legExists = user.legs.some(leg => leg.legNumber === legNumber);
          if (legExists) continue;

          // Initialize level structure for this leg
          const levels = {};
          for (let lvl = 1; lvl <= 21; lvl++) {
            levels[`level${lvl}`] = {
              users: [],
              earnings: 0,
              teamCashback: 0,
              isUnlocked: lvl <= 3, // First 3 levels always unlocked
              unlockedAt: lvl <= 3 ? new Date() : null,
              requiresDirectReferral: lvl > 3,
              pendingUnlock: false
            };
          }

          // Create new leg
          const newLeg = {
            legNumber,
            rootUser: referralId,
            joinedAt: user.createdAt || new Date(),
            isActive: true,
            levels,
            stats: {
              totalUsers: 1, // Start with root user
              totalEarnings: 0,
              totalTeamCashback: 0,
              lastActivity: new Date(),
              lastUnlockCheck: new Date()
            },
            pendingUnlocks: []
          };

          user.legs.push(newLeg);
          console.log(`   ✅ Created Leg ${legNumber} for direct referral ${referralId}`);
        }

        // ===== STEP 2: Migrate downline users to appropriate legs =====
        // Build a map of user to their referrer
        const allUsers = await User.find({}).session(session);
        const userReferrerMap = new Map();
        
        for (const u of allUsers) {
          if (u.referredBy) {
            userReferrerMap.set(u._id.toString(), u.referredBy.toString());
          }
        }

        // For each user in downline, find which leg they belong to
        for (let level = 2; level <= 21; level++) {
          const levelKey = `level${level}`;
          const usersAtLevel = oldReferralTree[levelKey] || [];
          
          if (usersAtLevel.length > 0) {
            console.log(`   📋 Processing Level ${level}: ${usersAtLevel.length} users`);
          }

          for (const downlineUserId of usersAtLevel) {
            // Find which leg this user belongs to by tracing back to root
            let currentUserId = downlineUserId;
            let rootUserId = null;

            // Trace back up to 21 levels to find the root (direct referral)
            for (let traceLevel = 0; traceLevel < 21; traceLevel++) {
              const referrerId = userReferrerMap.get(currentUserId?.toString());
              if (!referrerId) break;
              
              // Check if this referrer is a direct referral of current user
              const isDirectReferral = directReferrals.some(
                id => id && id.toString() === referrerId.toString()
              );
              
              if (isDirectReferral) {
                rootUserId = referrerId;
                break;
              }
              
              currentUserId = referrerId;
            }

            // If we found the root, add user to that leg at appropriate level
            if (rootUserId) {
              const legIndex = user.legs.findIndex(
                leg => leg.rootUser && leg.rootUser.toString() === rootUserId.toString()
              );

              if (legIndex >= 0) {
                const leg = user.legs[legIndex];
                const levelKey = `level${level}`;
                
                if (leg.levels[levelKey]) {
                  // Check if user already exists in this level
                  const userExists = leg.levels[levelKey].users.some(
                    id => id && id.toString() === downlineUserId.toString()
                  );
                  
                  if (!userExists) {
                    leg.levels[levelKey].users.push(downlineUserId);
                    leg.stats.totalUsers++;
                    
                    console.log(`      ✅ Added user to Leg ${legIndex + 1} Level ${level}`);
                  }
                }
              }
            }
          }
        }

        // ===== STEP 3: Migrate earnings data =====
        if (user.referralEarnings) {
          user.totalEarnings = user.referralEarnings.total || 0;
          
          // Migrate level-wise earnings
          if (!user.earningsByLevel) {
            user.earningsByLevel = {};
          }
          
          for (let level = 1; level <= 21; level++) {
            const levelKey = `level${level}`;
            user.earningsByLevel[levelKey] = user.referralEarnings[levelKey] || 0;
          }
        }

        // ===== STEP 4: Migrate team cashback data =====
        if (user.teamCashback) {
          // Distribute team cashback to appropriate legs
          for (let level = 1; level <= 21; level++) {
            const levelKey = `level${level}`;
            const teamData = user.teamCashback[levelKey];
            
            if (teamData && teamData.total > 0) {
              // Distribute evenly across all legs that have users at this level
              const legsWithUsers = user.legs.filter(
                leg => leg.levels[levelKey]?.users.length > 0
              );
              
              if (legsWithUsers.length > 0) {
                const amountPerLeg = teamData.total / legsWithUsers.length;
                
                for (const leg of legsWithUsers) {
                  leg.levels[levelKey].teamCashback = (leg.levels[levelKey].teamCashback || 0) + amountPerLeg;
                  leg.stats.totalTeamCashback = (leg.stats.totalTeamCashback || 0) + amountPerLeg;
                }
              }
            }
          }
        }

        // ===== STEP 5: Migrate missed commissions =====
        // Check if there are any old missed commissions to migrate
        if (user.missedCommissions && user.missedCommissions.length > 0) {
          // Already in correct format, just ensure they have leg numbers
          for (const mc of user.missedCommissions) {
            if (!mc.legNumber && user.legs.length > 0) {
              mc.legNumber = 1; // Default to leg 1
            }
          }
        }

        // ===== STEP 6: Update teamStats =====
        if (!user.teamStats) {
          user.teamStats = {
            totalTeam: 0,
            activeLegs: user.legs.length,
            lastUpdated: new Date()
          };
        }
        
        // Calculate total team from all legs
        let totalTeam = 0;
        for (const leg of user.legs) {
          totalTeam += leg.stats.totalUsers || 0;
        }
        user.teamStats.totalTeam = totalTeam;
        user.teamStats.activeLegs = user.legs.length;
        user.teamStats.lastUpdated = new Date();

        // ===== STEP 7: Set directReferralsCount =====
        user.directReferralsCount = user.legs.length;

        // Save the migrated user
        await user.save({ session });
        migratedCount++;
        
        console.log(`   ✅ Successfully migrated user ${user.userId}`);
        console.log(`      Created ${user.legs.length} legs with total ${totalTeam} team members`);

      } catch (userError) {
        console.error(`   ❌ Error migrating user ${user.userId}:`, userError);
        errorCount++;
      }
    }

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    console.log('\n🎉 Migration completed!');
    console.log(`   ✅ Migrated: ${migratedCount} users`);
    console.log(`   ⏭️ Skipped: ${skippedCount} users (already migrated)`);
    console.log(`   ❌ Errors: ${errorCount} users`);
    
    return {
      success: true,
      migrated: migratedCount,
      skipped: skippedCount,
      errors: errorCount
    };

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// ===== VERIFY MIGRATION =====
async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');
  
  const users = await User.find({});
  let verified = 0;
  let issues = 0;

  for (const user of users) {
    let userIssues = false;
    
    // Check if user has legs
    if (!user.legs || user.legs.length === 0) {
      console.log(`   ⚠️ User ${user.userId} has no legs`);
      userIssues = true;
    }
    
    // Check if directReferralsCount matches legs length
    if (user.directReferralsCount !== user.legs?.length) {
      console.log(`   ⚠️ User ${user.userId}: directReferralsCount (${user.directReferralsCount}) != legs.length (${user.legs?.length})`);
      userIssues = true;
    }
    
    // Check level structure in each leg
    for (const leg of user.legs || []) {
      for (let level = 1; level <= 21; level++) {
        const levelKey = `level${level}`;
        if (!leg.levels || !leg.levels[levelKey]) {
          console.log(`   ⚠️ User ${user.userId} Leg ${leg.legNumber} missing level ${level}`);
          userIssues = true;
        }
      }
    }
    
    if (userIssues) {
      issues++;
    } else {
      verified++;
    }
  }
  
  console.log(`\n✅ Verification complete:`);
  console.log(`   ✅ Verified: ${verified} users`);
  console.log(`   ⚠️ Issues found: ${issues} users`);
}

// ===== RUN MIGRATION =====
async function runMigration() {
  try {
    // Get MongoDB URI from environment
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGO_URI is not defined in environment!');
      console.log('\nPlease create a .env file with:');
      console.log('MONGO_URI=mongodb://localhost:27017/cpaylink');
      process.exit(1);
    }

    console.log(`📦 Connecting to MongoDB: ${mongoUri}`);
    
    // नवीन MongoDB driver साठी - options काढून टाका
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Run migration
    const result = await migrateUsersToNewStructure();
    
    // Verify migration
    await verifyMigration();
    
    console.log('\n✨ Migration process finished');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('📦 MongoDB connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { migrateUsersToNewStructure, verifyMigration };