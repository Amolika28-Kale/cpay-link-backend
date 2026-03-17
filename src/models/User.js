
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// // ========== LEVEL SCHEMA (inside each leg) ==========
// const levelSchema = new mongoose.Schema({
//   users: [{ 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: "User" 
//   }], // या level मधील users
//   earnings: { 
//     type: Number, 
//     default: 0 
//   }, // या level वरून मिळालेले earnings
//   teamCashback: { 
//     type: Number, 
//     default: 0 
//   }, // या level च्या team ने केलेले cashback
//   isUnlocked: { 
//     type: Boolean, 
//     default: false 
//   }, // हे level unlock आहे का?
//   unlockedAt: { 
//     type: Date, 
//     default: null 
//   }, // केव्हा unlock झालं?
//   requiredLevels: [{ 
//     type: Number 
//   }] // कोणते levels पूर्ण झाले पाहिजेत? (ex: [1,2,3] for level 4)
// }, { _id: false });

// // ========== LEG SCHEMA (dynamic) ==========
// const legSchema = new mongoose.Schema({
//   legNumber: { 
//     type: Number, 
//     required: true 
//   }, // Leg क्रमांक (1,2,3,...)
  
//   rootUser: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: "User", 
//     required: true 
//   }, // या leg चा root user (direct referral)
  
//   joinedAt: { 
//     type: Date, 
//     default: Date.now 
//   }, // केव्हा join झाला?
  
//   isActive: { 
//     type: Boolean, 
//     default: true 
//   }, // Leg active आहे का?
  
//   // 21 Levels in each leg
//   levels: {
//     level1: levelSchema,
//     level2: levelSchema,
//     level3: levelSchema,
//     level4: levelSchema,
//     level5: levelSchema,
//     level6: levelSchema,
//     level7: levelSchema,
//     level8: levelSchema,
//     level9: levelSchema,
//     level10: levelSchema,
//     level11: levelSchema,
//     level12: levelSchema,
//     level13: levelSchema,
//     level14: levelSchema,
//     level15: levelSchema,
//     level16: levelSchema,
//     level17: levelSchema,
//     level18: levelSchema,
//     level19: levelSchema,
//     level20: levelSchema,
//     level21: levelSchema
//   },
  
//   // Leg statistics
//   stats: {
//     totalUsers: { type: Number, default: 1 }, // Leg मधील एकूण users (root सह)
//     totalEarnings: { type: Number, default: 0 }, // या leg वरून मिळालेले एकूण earnings
//     totalTeamCashback: { type: Number, default: 0 }, // या leg चे एकूण team cashback
//     lastActivity: { type: Date, default: Date.now }
//   }
// }, { _id: true });

// // ========== MAIN USER SCHEMA ==========
// const userSchema = new mongoose.Schema({
//   userId: { 
//     type: String, 
//     required: true, 
//     unique: true,
//     trim: true
//   },

//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true,
//     trim: true,
//     match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
//   },
  
//   pin: { 
//     type: String, 
//     required: true 
//   },

//   role: {
//     type: String,
//     enum: ["user", "admin"],
//     default: "user"
//   },

//   firstDepositCompleted: { type: Boolean, default: false },
//   firstAcceptCompleted: { type: Boolean, default: false },
//   totalPayRequests: { type: Number, default: 0 },
//   totalAcceptedRequests: { type: Number, default: 0 },

//   referralCode: { type: String, unique: true },
//   referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  
//   // ========== DYNAMIC LEGS ARRAY ==========
//   // प्रत्येक direct referral साठी एक नवीन leg तयार होईल
//   legs: [legSchema],
  
//   // Direct referrals count (for quick access)
//   directReferralsCount: { 
//     type: Number, 
//     default: 0 
//   },
  
//   // ========== COMMISSION RATES (21 levels) ==========
//   commissionRates: {
//     level1: { type: Number, default: 0.30 },  // 30%
//     level2: { type: Number, default: 0.15 },  // 15%
//     level3: { type: Number, default: 0.10 },  // 10%
//     level4: { type: Number, default: 0.05 },  // 5%
//     level5: { type: Number, default: 0.30 },  // 30%
//     level6: { type: Number, default: 0.03 },  // 3%
//     level7: { type: Number, default: 0.04 },  // 4%
//     level8: { type: Number, default: 0.03 },  // 3%
//     level9: { type: Number, default: 0.03 },  // 3%
//     level10: { type: Number, default: 0.30 }, // 30%
//     level11: { type: Number, default: 0.03 }, // 3%
//     level12: { type: Number, default: 0.03 }, // 3%
//     level13: { type: Number, default: 0.03 }, // 3%
//     level14: { type: Number, default: 0.03 }, // 3%
//     level15: { type: Number, default: 0.03 }, // 3%
//     level16: { type: Number, default: 0.05 }, // 5%
//     level17: { type: Number, default: 0.10 }, // 10%
//     level18: { type: Number, default: 0.15 }, // 15%
//     level19: { type: Number, default: 0.30 }, // 30%
//     level20: { type: Number, default: 0.30 }, // 30%
//     level21: { type: Number, default: 0.63 }  // 63%
//   },

//   // ========== EARNINGS SUMMARY ==========
//   totalEarnings: {
//     type: Number,
//     default: 0
//   },
  
//   earningsByLevel: {
//     level1: { type: Number, default: 0 },
//     level2: { type: Number, default: 0 },
//     level3: { type: Number, default: 0 },
//     level4: { type: Number, default: 0 },
//     level5: { type: Number, default: 0 },
//     level6: { type: Number, default: 0 },
//     level7: { type: Number, default: 0 },
//     level8: { type: Number, default: 0 },
//     level9: { type: Number, default: 0 },
//     level10: { type: Number, default: 0 },
//     level11: { type: Number, default: 0 },
//     level12: { type: Number, default: 0 },
//     level13: { type: Number, default: 0 },
//     level14: { type: Number, default: 0 },
//     level15: { type: Number, default: 0 },
//     level16: { type: Number, default: 0 },
//     level17: { type: Number, default: 0 },
//     level18: { type: Number, default: 0 },
//     level19: { type: Number, default: 0 },
//     level20: { type: Number, default: 0 },
//     level21: { type: Number, default: 0 }
//   },

//   // ========== TEAM STATS ==========
//   teamStats: {
//     totalTeam: { type: Number, default: 0 },
//     activeLegs: { type: Number, default: 0 },
//     lastUpdated: { type: Date, default: Date.now }
//   },

//   // ========== MISSED COMMISSIONS TRACKING ==========
//   missedCommissions: [{
//     amount: { type: Number, required: true },
//     level: { type: Number, required: true },
//     legNumber: { type: Number, required: true },
//     reason: { type: String, required: true },
//     sourceUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//     sourceAmount: { type: Number },
//     date: { type: Date, default: Date.now },
//     read: { type: Boolean, default: false }
//   }],

//   // Wallet Activation Fields
//   walletActivated: { type: Boolean, default: false },
//   activationDate: { type: Date, default: null },
//   activationExpiryDate: { type: Date, default: null },
//   dailyAcceptLimit: { type: Number, default: 1000 },
  
//   // 7-Day Limit Fields
//   sevenDayTotalAccepted: { type: Number, default: 0 },
//   sevenDayResetDate: { type: Date, default: null },
//   activationHistory: [{
//     date: { type: Date, default: Date.now },
//     limit: Number,
//     amount: Number,
//     expiryDate: Date,
//     status: { type: String, enum: ['ACTIVE', 'EXPIRED'], default: 'ACTIVE' }
//   }],
  
//   autoRequest: {
//     firstRequestCreated: { type: Boolean, default: false },
//     firstRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "Scanner", default: null },
//     firstRequestAmount: { type: Number, default: 0 },
//     firstRequestCreatedAt: { type: Date, default: null },
//     firstRequestExpiresAt: { type: Date, default: null },
//     firstRequestCompleted: { type: Boolean, default: false },
//     firstRequestCompletedAt: { type: Date, default: null },
    
//     secondRequestCreated: { type: Boolean, default: false },
//     secondRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "Scanner", default: null },
//     secondRequestAmount: { type: Number, default: 0 },
//     secondRequestCreatedAt: { type: Date, default: null },
//     secondRequestExpiresAt: { type: Date, default: null },
//     secondRequestCompleted: { type: Boolean, default: false },
//     secondRequestCompletedAt: { type: Date, default: null },
    
//     nextRequestScheduledAt: { type: Date, default: null },
//     autoRequestCompleted: { type: Boolean, default: false },
    
//     totalAutoRequests: { type: Number, default: 0 },
//     autoRequestsAccepted: { type: Number, default: 0 },
//     currentRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "Scanner", default: null }
//   }

// }, { timestamps: true });

// // ========== PRE-SAVE HOOKS ==========

// // Hash PIN before saving
// userSchema.pre('save', async function () {
//   if (this.isModified('pin')) {
//     const salt = await bcrypt.genSalt(10);
//     this.pin = await bcrypt.hash(this.pin, salt);
//   }
// });

// // Generate referral code
// userSchema.pre('save', async function () {
//   if (this.referralCode) return;

//   let code;
//   let exists;

//   do {
//     code = Math.random().toString(36).substring(2, 8).toUpperCase();
//     exists = await mongoose.models.User.findOne({ referralCode: code });
//   } while (exists);

//   this.referralCode = code;
// });

// // ========== STATIC METHODS ==========

// /**
//  * Commission rates for all levels
//  */
// userSchema.statics.getCommissionRates = function() {
//   return {
//     level1: 0.30, level2: 0.15, level3: 0.10, level4: 0.05, level5: 0.30,
//     level6: 0.03, level7: 0.04, level8: 0.03, level9: 0.03, level10: 0.30,
//     level11: 0.03, level12: 0.03, level13: 0.03, level14: 0.03, level15: 0.03,
//     level16: 0.05, level17: 0.10, level18: 0.15, level19: 0.30, level20: 0.30,
//     level21: 0.63
//   };
// };

// /**
//  * Level unlock requirements (3-level rule)
//  */
// userSchema.statics.getLevelRequirements = function() {
//   const requirements = {};
  
//   // Levels 1-3 always unlocked
//   requirements[1] = { required: [], isBaseLevel: true };
//   requirements[2] = { required: [], isBaseLevel: true };
//   requirements[3] = { required: [], isBaseLevel: true };
  
//   // Level 4 needs levels 1,2,3
//   requirements[4] = { required: [1, 2, 3], isBaseLevel: false };
  
//   // Level 5 needs levels 2,3,4
//   requirements[5] = { required: [2, 3, 4], isBaseLevel: false };
  
//   // Level 6 needs levels 3,4,5
//   requirements[6] = { required: [3, 4, 5], isBaseLevel: false };
  
//   // Level 7 needs levels 4,5,6
//   requirements[7] = { required: [4, 5, 6], isBaseLevel: false };
  
//   // Level 8 needs levels 5,6,7
//   requirements[8] = { required: [5, 6, 7], isBaseLevel: false };
  
//   // Level 9 needs levels 6,7,8
//   requirements[9] = { required: [6, 7, 8], isBaseLevel: false };
  
//   // Level 10 needs levels 7,8,9
//   requirements[10] = { required: [7, 8, 9], isBaseLevel: false };
  
//   // Level 11 needs levels 8,9,10
//   requirements[11] = { required: [8, 9, 10], isBaseLevel: false };
  
//   // Level 12 needs levels 9,10,11
//   requirements[12] = { required: [9, 10, 11], isBaseLevel: false };
  
//   // Level 13 needs levels 10,11,12
//   requirements[13] = { required: [10, 11, 12], isBaseLevel: false };
  
//   // Level 14 needs levels 11,12,13
//   requirements[14] = { required: [11, 12, 13], isBaseLevel: false };
  
//   // Level 15 needs levels 12,13,14
//   requirements[15] = { required: [12, 13, 14], isBaseLevel: false };
  
//   // Level 16 needs levels 13,14,15
//   requirements[16] = { required: [13, 14, 15], isBaseLevel: false };
  
//   // Level 17 needs levels 14,15,16
//   requirements[17] = { required: [14, 15, 16], isBaseLevel: false };
  
//   // Level 18 needs levels 15,16,17
//   requirements[18] = { required: [15, 16, 17], isBaseLevel: false };
  
//   // Level 19 needs levels 16,17,18
//   requirements[19] = { required: [16, 17, 18], isBaseLevel: false };
  
//   // Level 20 needs levels 17,18,19
//   requirements[20] = { required: [17, 18, 19], isBaseLevel: false };
  
//   // Level 21 needs levels 18,19,20
//   requirements[21] = { required: [18, 19, 20], isBaseLevel: false };
  
//   return requirements;
// };

// /**
//  * Get horizontal requirements (based on direct referrals count)
//  */
// userSchema.statics.getHorizontalRequirements = function() {
//   return {
//     4: { minDirects: 2 }, // Levels 4-6 need 2 direct referrals
//     5: { minDirects: 2 },
//     6: { minDirects: 2 },
//     7: { minDirects: 3 }, // Levels 7-9 need 3 direct referrals
//     8: { minDirects: 3 },
//     9: { minDirects: 3 },
//     10: { minDirects: 4 }, // Levels 10-12 need 4 direct referrals
//     11: { minDirects: 4 },
//     12: { minDirects: 4 },
//     13: { minDirects: 5 }, // Levels 13-15 need 5 direct referrals
//     14: { minDirects: 5 },
//     15: { minDirects: 5 },
//     16: { minDirects: 6 }, // Levels 16-18 need 6 direct referrals
//     17: { minDirects: 6 },
//     18: { minDirects: 6 },
//     19: { minDirects: 7 }, // Levels 19-21 need 7 direct referrals
//     20: { minDirects: 7 },
//     21: { minDirects: 7 }
//   };
// };

// // ========== INSTANCE METHODS ==========

// /**
//  * Create a new leg when someone joins with referral code
//  * सगळ्या legs सुरुवातीपासून active असतात
//  */
// userSchema.methods.createNewLeg = async function(newUserId) {
//   const legNumber = this.legs.length + 1;
  
//   console.log(`\n🦵 Creating new Leg ${legNumber} for user ${newUserId}`);
  
//   // Initialize level structure
//   const levels = {};
//   for (let i = 1; i <= 21; i++) {
//     levels[`level${i}`] = {
//       users: i === 1 ? [newUserId] : [], // Level 1 मध्ये नवीन user
//       earnings: 0,
//       teamCashback: 0,
//       isUnlocked: i <= 3, // Levels 1-3 always unlocked
//       unlockedAt: i <= 3 ? new Date() : null,
//       requiredLevels: []
//     };
//   }
  
//   // Create new leg - सगळ्या legs active असतात
//   const newLeg = {
//     legNumber,
//     rootUser: newUserId,
//     joinedAt: new Date(),
//     isActive: true, // सगळ्या legs active
//     levels,
//     stats: {
//       totalUsers: 1,
//       totalEarnings: 0,
//       totalTeamCashback: 0,
//       lastActivity: new Date()
//     }
//   };
  
//   this.legs.push(newLeg);
//   this.directReferralsCount = this.legs.length;
//   this.teamStats.activeLegs = this.legs.length; // सगळ्या legs active
//   this.teamStats.totalTeam = this.legs.length;
  
//   await this.save();
  
//   console.log(`   ✅ Leg ${legNumber} created successfully (ACTIVE)`);
  
//   return legNumber;
// };

// /**
//  * Add user to referral tree (all legs of upline)
//  */
// userSchema.statics.addToReferralTree = async function(userId, referrerId, session = null) {
//   if (!referrerId) return;
  
//   const User = this;
//   const referrer = await User.findById(referrerId).session(session);
  
//   if (!referrer) return;
  
//   console.log(`\n📊 Adding user to ${referrer.userId}'s tree`);
  
//   // ========== FIND WHICH LEG THIS USER BELONGS TO ==========
//   // Find the leg where the direct referrer is the root user
//   let targetLegIndex = -1;
//   const newUser = await User.findById(userId).session(session);
  
//   if (newUser && newUser.referredBy) {
//     for (let i = 0; i < referrer.legs.length; i++) {
//       const leg = referrer.legs[i];
//       if (leg.rootUser?.toString() === newUser.referredBy.toString()) {
//         targetLegIndex = i;
//         console.log(`   ✅ Found target leg: Leg ${leg.legNumber}`);
//         break;
//       }
//     }
//   }
  
//   // If no target leg found, add to all active legs
//   if (targetLegIndex === -1) {
//     console.log(`   ℹ️ No specific leg found, adding to all active legs`);
//   }
  
//   // ========== ADD TO UPLINE'S LEGS ==========
//   for (let legIndex = 0; legIndex < referrer.legs.length; legIndex++) {
//     const leg = referrer.legs[legIndex];
    
//     // Skip inactive legs
//     if (!leg.isActive) continue;
    
//     // If target leg is specified, only add to that leg
//     if (targetLegIndex !== -1 && legIndex !== targetLegIndex) continue;
    
//     // Find the first available unlocked level in this leg
//     for (let levelNum = 1; levelNum <= 21; levelNum++) {
//       const levelKey = `level${levelNum}`;
//       const level = leg.levels[levelKey];
      
//       // Check if this level is unlocked
//       if (!level.isUnlocked) continue;
      
//       // Check if user already exists in this level
//       if (level.users.includes(userId)) break;
      
//       // Add user to this level
//       level.users.push(userId);
      
//       // Update leg stats
//       leg.stats.totalUsers++;
//       leg.stats.lastActivity = new Date();
      
//       console.log(`   ✅ Added to Leg ${leg.legNumber} - Level ${levelNum}`);
      
//       // Check if this addition unlocks new levels
//       await referrer.checkAndUnlockLevels(legIndex);
      
//       break; // Move to next leg after adding
//     }
//   }
  
//   // Update referrer's team stats
//   referrer.teamStats.totalTeam++;
//   referrer.teamStats.lastUpdated = new Date();
  
//   await referrer.save({ session });
  
//   // Continue up the tree
//   if (referrer.referredBy) {
//     await User.addToReferralTree(userId, referrer.referredBy, session);
//   }
// };

// /**
//  * Check if a specific level is accessible in a specific leg
//  * @param {number} level - The level number (1-21)
//  * @param {number} legIndex - The index of the leg in legs array
//  * @returns {boolean} - Whether the level is accessible
//  */
// userSchema.methods.isLevelAccessible = function(level, legIndex) {
//   // Levels 1-3 are always accessible in any leg
//   if (level <= 3) {
//     return true;
//   }
  
//   // Calculate required direct referrals for this level range
//   const requiredDirects = Math.ceil(level / 3);
  
//   // Check if user has enough direct referrals (horizontal requirement)
//   if (this.legs.length < requiredDirects) {
//     return false;
//   }
  
//   // If legIndex is provided, check specific leg
//   if (legIndex !== undefined && this.legs[legIndex]) {
//     const leg = this.legs[legIndex];
//     const levelKey = `level${level}`;
    
//     // Check if level is unlocked in this specific leg
//     if (leg.levels[levelKey]?.isUnlocked) {
//       return true;
//     }
    
//     return false;
//   }
  
//   // If no legIndex, check if level is unlocked in ANY leg
//   for (const leg of this.legs) {
//     const levelKey = `level${level}`;
//     if (leg.levels[levelKey]?.isUnlocked) {
//       return true;
//     }
//   }
  
//   return false;
// };

// /**
//  * Check and unlock levels in a specific leg based on 3-level rule
//  * @param {number} legIndex - The index of the leg to check
//  * @returns {Object} - Result with unlocked levels and any missed commissions info
//  */
// /**
//  * Check and unlock levels in a specific leg based on 3-level rule
//  * प्रत्येक leg स्वतंत्रपणे काम करते
//  */
// userSchema.methods.checkAndUnlockLevels = async function(legIndex) {
//   const leg = this.legs[legIndex];
//   if (!leg) return { unlocked: false, missedCommissions: [] };
  
//   const directReferralsCount = this.legs.length;
//   const missedCommissions = [];
  
//   console.log(`\n🔓 Checking unlocks for Leg ${leg.legNumber}:`);
//   console.log(`   Total Direct Referrals: ${directReferralsCount}`);
  
//   let unlockedAny = false;
  
//   // ===== STEP 1: ENSURE LEG IS ACTIVE =====
//   // सगळ्या legs active असायला हव्यात - independent working
//   if (!leg.isActive) {
//     leg.isActive = true;
//     console.log(`   ✅ Leg ${leg.legNumber} is now ACTIVE`);
//     unlockedAny = true;
//   }
  
//   // ===== STEP 2: UNLOCK LEVELS WITHIN THIS LEG =====
//   // Levels 1-3 are always unlocked
//   for (let levelNum = 4; levelNum <= 21; levelNum++) {
//     const levelKey = `level${levelNum}`;
//     const level = leg.levels[levelKey];
    
//     // Skip if already unlocked
//     if (level.isUnlocked) continue;
    
//     // Calculate required direct referrals for this level range
//     const requiredDirects = Math.ceil(levelNum / 3);
//     // Level 4-6: requiredDirects = 2
//     // Level 7-9: requiredDirects = 3
//     // etc...
    
//     // Check horizontal requirement (enough direct referrals)
//     if (directReferralsCount < requiredDirects) {
//       // This level can't be unlocked yet - needs more direct referrals
//       missedCommissions.push({
//         legNumber: leg.legNumber,
//         level: levelNum,
//         requiredDirects,
//         currentDirects: directReferralsCount,
//         reason: `Need ${requiredDirects} direct referrals (have ${directReferralsCount})`,
//         potentialRate: this.commissionRates[`level${levelNum}`] * 100
//       });
//       continue;
//     }
    
//     // Check vertical requirement (previous levels in THIS LEG have users)
//     const prevLevels = [levelNum - 3, levelNum - 2, levelNum - 1];
//     let allPrevHaveUsers = true;
    
//     for (const prevLevel of prevLevels) {
//       if (prevLevel < 1) continue;
//       const prevLevelKey = `level${prevLevel}`;
//       if (leg.levels[prevLevelKey].users.length === 0) {
//         allPrevHaveUsers = false;
//         break;
//       }
//     }
    
//     if (allPrevHaveUsers) {
//       level.isUnlocked = true;
//       level.unlockedAt = new Date();
//       level.requiredLevels = prevLevels;
//       unlockedAny = true;
      
//       console.log(`   ✅ Leg ${leg.legNumber} Level ${levelNum} unlocked! (Need ${requiredDirects} directs, have ${directReferralsCount})`);
//     } else {
//       // Missed opportunity - previous levels in this leg are empty
//       missedCommissions.push({
//         legNumber: leg.legNumber,
//         level: levelNum,
//         requiredDirects,
//         currentDirects: directReferralsCount,
//         reason: `Previous levels (${prevLevels.join(', ')}) in Leg ${leg.legNumber} are empty`,
//         potentialRate: this.commissionRates[`level${levelNum}`] * 100
//       });
//     }
//   }
  
//   if (unlockedAny) {
//     await this.save();
//   }
  
//   return { unlocked: unlockedAny, missedCommissions };
// };

// /**
//  * Check all legs for unlock opportunities
//  * @returns {Object} - Summary of unlocks and missed commissions
//  */
// userSchema.methods.checkAllLegsForUnlocks = async function() {
//   let totalUnlocked = false;
//   const allMissedCommissions = [];
  
//   for (let i = 0; i < this.legs.length; i++) {
//     const result = await this.checkAndUnlockLevels(i);
//     if (result.unlocked) totalUnlocked = true;
//     allMissedCommissions.push(...result.missedCommissions);
//   }
  
//   return {
//     unlocked: totalUnlocked,
//     missedCommissions: allMissedCommissions
//   };
// };

// /**
//  * Add a missed commission record
//  */
// userSchema.methods.addMissedCommission = function(data) {
//   this.missedCommissions.push({
//     amount: data.amount,
//     level: data.level,
//     legNumber: data.legNumber,
//     reason: data.reason,
//     sourceUserId: data.sourceUserId,
//     sourceAmount: data.sourceAmount,
//     date: new Date(),
//     read: false
//   });
// };

// /**
//  * Calculate earnings for a transaction
//  */
// userSchema.methods.calculateEarnings = async function(transactionAmount, downlineUserId, session = null) {
//   let totalEarning = 0;
  
//   // Find which leg contains this downline user
//   for (let legIndex = 0; legIndex < this.legs.length; legIndex++) {
//     const leg = this.legs[legIndex];
    
//     for (let levelNum = 1; levelNum <= 21; levelNum++) {
//       const levelKey = `level${levelNum}`;
//       const level = leg.levels[levelKey];
      
//       if (level.users.includes(downlineUserId)) {
//         // Found the user in this leg at this level
//         const rate = this.commissionRates[`level${levelNum}`] || 0;
//         const earning = transactionAmount * rate;
        
//         // Update level earnings
//         level.earnings = (level.earnings || 0) + earning;
        
//         // Update leg stats
//         leg.stats.totalEarnings = (leg.stats.totalEarnings || 0) + earning;
//         leg.stats.lastActivity = new Date();
        
//         // Update user totals
//         this.totalEarnings = (this.totalEarnings || 0) + earning;
//         this.earningsByLevel[`level${levelNum}`] = 
//           (this.earningsByLevel[`level${levelNum}`] || 0) + earning;
        
//         totalEarning += earning;
        
//         console.log(`💰 Leg ${leg.legNumber} Level ${levelNum}: ₹${earning} (${rate*100}%)`);
//         break;
//       }
//     }
//   }
  
//   await this.save({ session });
//   return totalEarning;
// };

// /**
//  * Get leg summary
//  */
// userSchema.methods.getLegSummary = function() {
//   const summary = {
//     totalLegs: this.legs.length,
//     directReferrals: this.directReferralsCount,
//     legs: []
//   };
  
//   for (let i = 0; i < this.legs.length; i++) {
//     const leg = this.legs[i];
    
//     // Calculate how many levels are unlocked in this leg
//     let unlockedLevels = 0;
//     for (let levelNum = 1; levelNum <= 21; levelNum++) {
//       if (leg.levels[`level${levelNum}`]?.isUnlocked) {
//         unlockedLevels++;
//       }
//     }
    
//     const legSummary = {
//       legNumber: leg.legNumber,
//       rootUser: leg.rootUser,
//       joinedAt: leg.joinedAt,
//       isActive: leg.isActive,
//       totalUsers: leg.stats.totalUsers,
//       totalEarnings: leg.stats.totalEarnings,
//       totalTeamCashback: leg.stats.totalTeamCashback,
//       unlockedLevels,
//       isFullyUnlocked: unlockedLevels === 21,
//       levels: {}
//     };
    
//     // Get level-wise data
//     for (let levelNum = 1; levelNum <= 21; levelNum++) {
//       const levelKey = `level${levelNum}`;
//       const level = leg.levels[levelKey];
      
//       legSummary.levels[`level${levelNum}`] = {
//         users: level.users.length,
//         earnings: level.earnings,
//         teamCashback: level.teamCashback,
//         isUnlocked: level.isUnlocked,
//         unlockedAt: level.unlockedAt
//       };
//     }
    
//     summary.legs.push(legSummary);
//   }
  
//   return summary;
// };

// /**
//  * Get team summary with all levels
//  */
// userSchema.methods.getTeamSummary = function() {
//   const summary = {
//     totalLegs: this.legs.length,
//     directReferrals: this.directReferralsCount,
//     totalTeam: this.teamStats.totalTeam,
//     earningsByLevel: this.earningsByLevel,
//     totalEarnings: this.totalEarnings,
//     levels: {}
//   };
  
//   // Initialize level counts
//   for (let levelNum = 1; levelNum <= 21; levelNum++) {
//     summary.levels[`level${levelNum}`] = {
//       users: 0,
//       earnings: this.earningsByLevel[`level${levelNum}`] || 0,
//       unlockedLegs: 0
//     };
//   }
  
//   // Aggregate data from all legs
//   for (const leg of this.legs) {
//     for (let levelNum = 1; levelNum <= 21; levelNum++) {
//       const levelKey = `level${levelNum}`;
//       const level = leg.levels[levelKey];
      
//       summary.levels[`level${levelNum}`].users += level.users.length;
//       if (level.isUnlocked) {
//         summary.levels[`level${levelNum}`].unlockedLegs++;
//       }
//     }
//   }
  
//   return summary;
// };

// /**
//  * Get missed commissions summary
//  */
// userSchema.methods.getMissedCommissionsSummary = function() {
//   const totalMissed = this.missedCommissions.reduce((sum, mc) => sum + mc.amount, 0);
//   const unreadCount = this.missedCommissions.filter(mc => !mc.read).length;
  
//   return {
//     totalMissed,
//     unreadCount,
//     recent: this.missedCommissions.slice(0, 10)
//   };
// };

// // Activation methods
// userSchema.methods.isActivationExpired = function() {
//   if (!this.activationExpiryDate) return true;
//   return new Date() > this.activationExpiryDate;
// };

// userSchema.methods.getRemainingDays = function() {
//   if (!this.activationExpiryDate) return 0;
//   const diffTime = this.activationExpiryDate - new Date();
//   return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
// };

// userSchema.methods.checkAndResetSevenDay = function() {
//   if (this.sevenDayResetDate && new Date() > this.sevenDayResetDate) {
//     this.sevenDayTotalAccepted = 0;
//     const newResetDate = new Date();
//     newResetDate.setDate(newResetDate.getDate() + 7);
//     this.sevenDayResetDate = newResetDate;
//     return true;
//   }
//   return false;
// };

// module.exports = mongoose.model('User', userSchema);

// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ========== LEVEL SCHEMA ==========
const levelSchema = new mongoose.Schema({
  users: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }],
  earnings: { type: Number, default: 0 },
  teamCashback: { type: Number, default: 0 },
  isUnlocked: { type: Boolean, default: false },
  unlockedAt: { type: Date, default: null }
}, { _id: false });

// ========== NOTIFICATION SCHEMA ==========
const notificationSchema = new mongoose.Schema({
  type: { type: String, enum: ['LEVEL_UNLOCKED', 'NEW_USER_ADDED'], required: true },
  message: { type: String, required: true },
  legNumber: { type: Number, required: true },
  level: { type: Number },
  data: { type: mongoose.Schema.Types.Mixed },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

// ========== LEG SCHEMA ==========
const legSchema = new mongoose.Schema({
  legNumber: { type: Number, required: true },
  rootUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  joinedAt: { type: Date, default: Date.now },
  levels: {
    level1: { type: levelSchema, default: () => ({}) },
    level2: { type: levelSchema, default: () => ({}) },
    level3: { type: levelSchema, default: () => ({}) },
    level4: { type: levelSchema, default: () => ({}) },
    level5: { type: levelSchema, default: () => ({}) },
    level6: { type: levelSchema, default: () => ({}) },
    level7: { type: levelSchema, default: () => ({}) },
    level8: { type: levelSchema, default: () => ({}) },
    level9: { type: levelSchema, default: () => ({}) },
    level10: { type: levelSchema, default: () => ({}) },
    level11: { type: levelSchema, default: () => ({}) },
    level12: { type: levelSchema, default: () => ({}) },
    level13: { type: levelSchema, default: () => ({}) },
    level14: { type: levelSchema, default: () => ({}) },
    level15: { type: levelSchema, default: () => ({}) },
    level16: { type: levelSchema, default: () => ({}) },
    level17: { type: levelSchema, default: () => ({}) },
    level18: { type: levelSchema, default: () => ({}) },
    level19: { type: levelSchema, default: () => ({}) },
    level20: { type: levelSchema, default: () => ({}) },
    level21: { type: levelSchema, default: () => ({}) }
  },
  stats: {
    totalUsers: { type: Number, default: 1 },
    totalEarnings: { type: Number, default: 0 },
    totalTeamCashback: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now }
  }
}, { _id: true });

// ========== MAIN USER SCHEMA ==========
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  pin: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  firstDepositCompleted: { type: Boolean, default: false },
  firstAcceptCompleted: { type: Boolean, default: false },
  totalPayRequests: { type: Number, default: 0 },
  totalAcceptedRequests: { type: Number, default: 0 },
  referralCode: { type: String, unique: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  legs: [legSchema],
  directReferralsCount: { type: Number, default: 0 },
  notifications: [notificationSchema],
  commissionRates: {
    level1: { type: Number, default: 0.30 }, level2: { type: Number, default: 0.15 },
    level3: { type: Number, default: 0.10 }, level4: { type: Number, default: 0.05 },
    level5: { type: Number, default: 0.30 }, level6: { type: Number, default: 0.03 },
    level7: { type: Number, default: 0.04 }, level8: { type: Number, default: 0.03 },
    level9: { type: Number, default: 0.03 }, level10: { type: Number, default: 0.30 },
    level11: { type: Number, default: 0.03 }, level12: { type: Number, default: 0.03 },
    level13: { type: Number, default: 0.03 }, level14: { type: Number, default: 0.03 },
    level15: { type: Number, default: 0.03 }, level16: { type: Number, default: 0.05 },
    level17: { type: Number, default: 0.10 }, level18: { type: Number, default: 0.15 },
    level19: { type: Number, default: 0.30 }, level20: { type: Number, default: 0.30 },
    level21: { type: Number, default: 0.63 }
  },
  totalEarnings: { type: Number, default: 0 },
  earningsByLevel: {
    level1: { type: Number, default: 0 }, level2: { type: Number, default: 0 },
    level3: { type: Number, default: 0 }, level4: { type: Number, default: 0 },
    level5: { type: Number, default: 0 }, level6: { type: Number, default: 0 },
    level7: { type: Number, default: 0 }, level8: { type: Number, default: 0 },
    level9: { type: Number, default: 0 }, level10: { type: Number, default: 0 },
    level11: { type: Number, default: 0 }, level12: { type: Number, default: 0 },
    level13: { type: Number, default: 0 }, level14: { type: Number, default: 0 },
    level15: { type: Number, default: 0 }, level16: { type: Number, default: 0 },
    level17: { type: Number, default: 0 }, level18: { type: Number, default: 0 },
    level19: { type: Number, default: 0 }, level20: { type: Number, default: 0 },
    level21: { type: Number, default: 0 }
  },
  teamStats: {
    totalTeam: { type: Number, default: 0 },
    activeLegs: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  },
  walletActivated: { type: Boolean, default: false },
  activationDate: { type: Date, default: null },
  activationExpiryDate: { type: Date, default: null },
  dailyAcceptLimit: { type: Number, default: 1000 },
  sevenDayTotalAccepted: { type: Number, default: 0 },
  sevenDayResetDate: { type: Date, default: null },
  activationHistory: [{
    date: { type: Date, default: Date.now },
    limit: Number, amount: Number, expiryDate: Date,
    status: { type: String, enum: ['ACTIVE', 'EXPIRED'], default: 'ACTIVE' }
  }],
  autoRequest: {
    firstRequestCreated: { type: Boolean, default: false },
    firstRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "Scanner", default: null },
    firstRequestAmount: { type: Number, default: 0 },
    firstRequestCreatedAt: { type: Date, default: null },
    firstRequestExpiresAt: { type: Date, default: null },
    firstRequestCompleted: { type: Boolean, default: false },
    firstRequestCompletedAt: { type: Date, default: null },
    secondRequestCreated: { type: Boolean, default: false },
    secondRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "Scanner", default: null },
    secondRequestAmount: { type: Number, default: 0 },
    secondRequestCreatedAt: { type: Date, default: null },
    secondRequestExpiresAt: { type: Date, default: null },
    secondRequestCompleted: { type: Boolean, default: false },
    secondRequestCompletedAt: { type: Date, default: null },
    nextRequestScheduledAt: { type: Date, default: null },
    autoRequestCompleted: { type: Boolean, default: false },
    totalAutoRequests: { type: Number, default: 0 },
    autoRequestsAccepted: { type: Number, default: 0 },
    currentRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "Scanner", default: null }
  }
}, { timestamps: true });

// ========== PRE-SAVE HOOKS - ONLY THESE TWO, BOTH WITH next PARAMETER ==========

// Hook 1: Hash PIN
userSchema.pre('save', async function(next) {
  try {
    if (this.isModified('pin')) {
      const salt = await bcrypt.genSalt(10);
      this.pin = await bcrypt.hash(this.pin, salt);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Hook 2: Generate referral code
userSchema.pre('save', async function(next) {
  try {
    if (this.referralCode) return next();

    let code;
    let exists;
    const User = mongoose.model('User');

    do {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      exists = await User.findOne({ referralCode: code });
    } while (exists);

    this.referralCode = code;
    next();
  } catch (error) {
    next(error);
  }
});

// ========== NO OTHER PRE-SAVE HOOKS BEYOND THIS POINT ==========
// इथे खाली कुठेही userSchema.pre('save' असणार नाही

// ========== INSTANCE METHODS ==========
// ... (तुमचे सगळे instance methods तसेच राहतील)
// तुम्ही ते खाली पेस्ट करू शकता

userSchema.methods.addNotification = function(type, message, legNumber, level = null, data = {}) {
  if (!this.notifications) this.notifications = [];
  this.notifications.push({ type, message, legNumber, level, data, read: false, createdAt: new Date() });
  console.log(`🔔 Notification added: ${message}`);
};

userSchema.methods.createNewLeg = async function(newUserId) {
  const legNumber = this.legs.length + 1;
  const directReferralsCount = this.legs.length + 1;
  const levels = {};
  const unlockedLevelsCount = directReferralsCount;
  
  for (let i = 1; i <= 21; i++) {
    levels[`level${i}`] = {
      users: i === 1 ? [newUserId] : [],
      earnings: 0, teamCashback: 0,
      isUnlocked: i <= unlockedLevelsCount,
      unlockedAt: i <= unlockedLevelsCount ? new Date() : null
    };
  }
  
  const newLeg = {
    legNumber, rootUser: newUserId, joinedAt: new Date(), levels,
    stats: { totalUsers: 1, totalEarnings: 0, totalTeamCashback: 0, lastActivity: new Date() }
  };
  
  this.legs.push(newLeg);
  this.directReferralsCount = this.legs.length;
  this.teamStats.totalTeam = (this.teamStats.totalTeam || 0) + 1;
  this.teamStats.activeLegs = this.legs.length;
  this.teamStats.lastUpdated = new Date();
  
  await this.save();
  console.log(`   ✅ Leg ${legNumber} created successfully, levels 1-${unlockedLevelsCount} unlocked`);
  return legNumber;
};

userSchema.methods.updateAllLegsUnlocks = async function() {
  const directReferralsCount = this.legs.length;
  const newlyUnlocked = [];
  
  for (let legIndex = 0; legIndex < this.legs.length; legIndex++) {
    const leg = this.legs[legIndex];
    for (let levelNum = 1; levelNum <= 21; levelNum++) {
      const level = leg.levels[`level${levelNum}`];
      if (levelNum <= directReferralsCount && !level.isUnlocked) {
        level.isUnlocked = true;
        level.unlockedAt = new Date();
        newlyUnlocked.push({ legNumber: leg.legNumber, level: levelNum });
      }
    }
  }
  
  if (newlyUnlocked.length > 0) {
    const unlocksByLeg = {};
    newlyUnlocked.forEach(u => {
      if (!unlocksByLeg[u.legNumber]) unlocksByLeg[u.legNumber] = [];
      unlocksByLeg[u.legNumber].push(u.level);
    });
    
    for (const [legNum, levels] of Object.entries(unlocksByLeg)) {
      this.addNotification('LEVEL_UNLOCKED', `Levels ${levels.join(', ')} unlocked in Leg ${legNum}!`, parseInt(legNum), levels[0]);
    }
  }
  
  await this.save();
  return { success: true, unlockedCount: newlyUnlocked.length, newlyUnlocked, currentUnlockedLevels: directReferralsCount };
};

userSchema.methods.processDirectReferral = async function(newUserId) {
  const legNumber = await this.createNewLeg(newUserId);
  const unlockResult = await this.updateAllLegsUnlocks();
  return { success: true, legNumber, unlockedLevels: unlockResult.currentUnlockedLevels, newlyUnlocked: unlockResult.newlyUnlocked };
};

userSchema.statics.addToReferralTree = async function(userId, referrerId, session = null) {
  if (!referrerId) return;
  const User = this;
  const referrer = await User.findById(referrerId).session(session);
  const newUser = await User.findById(userId).session(session);
  if (!referrer) return;
  
  const isDirectReferral = newUser && newUser.referredBy && newUser.referredBy.toString() === referrer._id.toString();
  
  if (isDirectReferral) {
    await referrer.processDirectReferral(userId);
  } else {
    for (let legIndex = 0; legIndex < referrer.legs.length; legIndex++) {
      const leg = referrer.legs[legIndex];
      for (let levelNum = 1; levelNum <= referrer.directReferralsCount; levelNum++) {
        const level = leg.levels[`level${levelNum}`];
        if (level.isUnlocked && !level.users.includes(userId)) {
          level.users.push(userId);
          leg.stats.totalUsers++;
          leg.stats.lastActivity = new Date();
          referrer.addNotification('NEW_USER_ADDED', `New user added to Leg ${leg.legNumber} at Level ${levelNum}`, leg.legNumber, levelNum, { userId, isIndirect: true });
          break;
        }
      }
    }
    referrer.teamStats.totalTeam = (referrer.teamStats.totalTeam || 0) + 1;
    referrer.teamStats.lastUpdated = new Date();
    await referrer.save({ session });
  }
  
  if (referrer.referredBy) {
    await User.addToReferralTree(userId, referrer.referredBy, session);
  }
};

userSchema.methods.isLevelAccessible = function(levelNum) {
  return levelNum <= this.directReferralsCount;
};

userSchema.methods.getLegSummary = function() {
  const summary = { totalLegs: this.legs.length, directReferrals: this.directReferralsCount, unlockedLevelsInEachLeg: this.directReferralsCount, legs: [] };
  for (let i = 0; i < this.legs.length; i++) {
    const leg = this.legs[i];
    const legSummary = { legNumber: leg.legNumber, rootUser: leg.rootUser, joinedAt: leg.joinedAt, totalUsers: leg.stats?.totalUsers || 0, totalEarnings: leg.stats?.totalEarnings || 0, unlockedLevels: this.directReferralsCount, isFullyUnlocked: this.directReferralsCount === 21, levels: {} };
    for (let levelNum = 1; levelNum <= 21; levelNum++) {
      const level = leg.levels[`level${levelNum}`];
      legSummary.levels[`level${levelNum}`] = { users: level?.users?.length || 0, earnings: level?.earnings || 0, teamCashback: level?.teamCashback || 0, isUnlocked: level?.isUnlocked || false, unlockedAt: level?.unlockedAt };
    }
    summary.legs.push(legSummary);
  }
  return summary;
};

userSchema.methods.getNotifications = function(limit = 20) {
  if (!this.notifications) return { unread: 0, notifications: [] };
  const sorted = [...this.notifications].sort((a, b) => b.createdAt - a.createdAt);
  return { unread: sorted.filter(n => !n.read).length, notifications: sorted.slice(0, limit) };
};

userSchema.methods.markNotificationRead = function(notificationId) {
  if (!this.notifications) return;
  const notification = this.notifications.id(notificationId);
  if (notification) notification.read = true;
};

userSchema.methods.getTeamSummary = function() {
  const summary = { totalLegs: this.legs.length, directReferrals: this.directReferralsCount, unlockedLevelsInEachLeg: this.directReferralsCount, totalTeam: this.teamStats?.totalTeam || 0, totalEarnings: this.totalEarnings || 0, unreadNotifications: this.notifications?.filter(n => !n.read).length || 0, levels: {} };
  for (let levelNum = 1; levelNum <= 21; levelNum++) {
    summary.levels[`level${levelNum}`] = { users: 0, earnings: this.earningsByLevel?.[`level${levelNum}`] || 0, isUnlocked: levelNum <= this.directReferralsCount };
  }
  for (const leg of this.legs) {
    for (let levelNum = 1; levelNum <= 21; levelNum++) {
      summary.levels[`level${levelNum}`].users += leg.levels[`level${levelNum}`]?.users?.length || 0;
    }
  }
  return summary;
};

userSchema.methods.isActivationExpired = function() {
  if (!this.activationExpiryDate) return true;
  return new Date() > this.activationExpiryDate;
};

userSchema.methods.getRemainingDays = function() {
  if (!this.activationExpiryDate) return 0;
  const diffTime = this.activationExpiryDate - new Date();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};

userSchema.methods.checkAndResetSevenDay = function() {
  if (this.sevenDayResetDate && new Date() > this.sevenDayResetDate) {
    this.sevenDayTotalAccepted = 0;
    const newResetDate = new Date();
    newResetDate.setDate(newResetDate.getDate() + 7);
    this.sevenDayResetDate = newResetDate;
    return true;
  }
  return false;
};

// ========== EXPORT MODEL ==========
module.exports = mongoose.model('User', userSchema);