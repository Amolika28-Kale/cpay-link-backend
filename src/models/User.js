// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

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
  
//   // 21-Level Referral Tree with Leg structure
//   referralTree: {
//     level1: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//     level2: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//     level3: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//     level4: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//     level5: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//     level6: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//     level7: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//     level8: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//     level9: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//     level10: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//     level11: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//     level12: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//     level13: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//     level14: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//     level15: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//     level16: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//     level17: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//     level18: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//     level19: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//     level20: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//     level21: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
//   },
  
//   referralRates: {
//     level1: { type: Number, default: 0.30 },
//     level2: { type: Number, default: 0.15 },
//     level3: { type: Number, default: 0.10 },
//     level4: { type: Number, default: 0.05 },
//     level5: { type: Number, default: 0.30 },
//     level6: { type: Number, default: 0.03 },
//     level7: { type: Number, default: 0.04 },
//     level8: { type: Number, default: 0.03 },
//     level9: { type: Number, default: 0.03 },
//     level10: { type: Number, default: 0.30 },
//     level11: { type: Number, default: 0.03 },
//     level12: { type: Number, default: 0.03 },
//     level13: { type: Number, default: 0.03 },
//     level14: { type: Number, default: 0.03 },
//     level15: { type: Number, default: 0.03 },
//     level16: { type: Number, default: 0.05 },
//     level17: { type: Number, default: 0.10 },
//     level18: { type: Number, default: 0.15 },
//     level19: { type: Number, default: 0.30 },
//     level20: { type: Number, default: 0.30 },
//     level21: { type: Number, default: 0.63 }
//   },
  
//   referralEarnings: {
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
//     level21: { type: Number, default: 0 },
//     total: { type: Number, default: 0 }
//   },

//   teamCashback: {
//     level1: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
//     level2: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
//     level3: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
//     level4: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
//     level5: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
//     level6: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
//     level7: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
//     level8: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
//     level9: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
//     level10: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
//     level11: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
//     level12: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
//     level13: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
//     level14: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
//     level15: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
//     level16: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
//     level17: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
//     level18: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
//     level19: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
//     level20: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
//     level21: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } }
//   },

//   legsUnlocked: {
//     leg1: { type: Boolean, default: false },
//     leg2: { type: Boolean, default: false },
//     leg3: { type: Boolean, default: false },
//     leg4: { type: Boolean, default: false },
//     leg5: { type: Boolean, default: false },
//     leg6: { type: Boolean, default: false },
//     leg7: { type: Boolean, default: false }
//   },

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

// // Method to check if activation is expired (7 days)
// userSchema.methods.isActivationExpired = function() {
//   if (!this.activationExpiryDate) return true;
//   return new Date() > this.activationExpiryDate;
// };

// // Method to get remaining days
// userSchema.methods.getRemainingDays = function() {
//   if (!this.activationExpiryDate) return 0;
//   const diffTime = this.activationExpiryDate - new Date();
//   return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
// };

// // Method to reset 7-day totals if needed
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

// // ========== CORRECTED LEG UNLOCK METHODS ==========

// /**
//  * Get leg requirements
//  */
// userSchema.statics.getLegRequirements = function() {
//   return {
//     leg1: { required: 1, levels: [1, 2, 3] },
//     leg2: { required: 2, levels: [4, 5, 6] },
//     leg3: { required: 3, levels: [7, 8, 9] },
//     leg4: { required: 4, levels: [10, 11, 12] },
//     leg5: { required: 5, levels: [13, 14, 15] },
//     leg6: { required: 6, levels: [16, 17, 18] },
//     leg7: { required: 7, levels: [19, 20, 21] }
//   };
// };

// /**
//  * Get leg for a specific level
//  */
// userSchema.methods.getLegForLevel = function(level) {
//   const requirements = this.constructor.getLegRequirements();
  
//   for (const [leg, data] of Object.entries(requirements)) {
//     if (data.levels.includes(level)) {
//       return leg;
//     }
//   }
//   return null;
// };

// /**
//  * Method to check if a specific level's leg is unlocked
//  * Leg unlocking is based on DIRECT REFERRALS count
//  */
// userSchema.methods.isLegUnlocked = function(level) {
//   const directCount = this.referralTree?.level1?.length || 0;
//   const requirements = this.constructor.getLegRequirements();
  
//   // Find which leg this level belongs to
//   for (const [leg, data] of Object.entries(requirements)) {
//     if (data.levels.includes(level)) {
//       // Check if user has enough direct referrals for this leg
//       return directCount >= data.required;
//     }
//   }
  
//   return false;
// };

// /**
//  * Method to unlock legs based on DIRECT REFERRALS count
//  * Each leg unlocks based on direct referrals count
//  */
// userSchema.methods.unlockLegs = async function() {
//   let changed = false;
  
//   // Get direct referrals count
//   const directCount = this.referralTree?.level1?.length || 0;
//   const requirements = this.constructor.getLegRequirements();
  
//   console.log(`\n🔓 Checking leg unlock for ${this.userId}:`);
//   console.log(`Direct referrals: ${directCount}`);
//   console.log(`Current legs unlocked:`, this.legsUnlocked);
  
//   // Check each leg requirement
//   for (const [leg, data] of Object.entries(requirements)) {
//     if (!this.legsUnlocked[leg] && directCount >= data.required) {
//       this.legsUnlocked[leg] = true;
//       changed = true;
//       console.log(`✅ ${leg} unlocked - ${data.required} direct referral${data.required > 1 ? 's' : ''}`);
//     }
//   }
  
//   if (changed) {
//     await this.save();
//     console.log(`✅ Updated legs unlocked for ${this.userId}:`, this.legsUnlocked);
//   } else {
//     console.log(`ℹ️ No new legs unlocked for ${this.userId}`);
//   }
  
//   return changed;
// };

// /**
//  * Get next leg to unlock
//  */
// userSchema.methods.getNextLegToUnlock = function() {
//   const directCount = this.referralTree?.level1?.length || 0;
//   const requirements = this.constructor.getLegRequirements();
//   const legOrder = ['leg1', 'leg2', 'leg3', 'leg4', 'leg5', 'leg6', 'leg7'];
  
//   for (const leg of legOrder) {
//     if (!this.legsUnlocked[leg]) {
//       const required = requirements[leg].required;
//       return {
//         leg,
//         required,
//         current: directCount,
//         remaining: Math.max(0, required - directCount),
//         levels: requirements[leg].levels,
//         isUnlockable: directCount >= required
//       };
//     }
//   }
  
//   return null; // All legs unlocked
// };

// /**
//  * Add user to referral tree (uplines)
//  * This function recursively adds the user to all upline levels
//  */
// userSchema.statics.addToReferralTree = async function(userId, referrerId, currentLevel = 1, session = null) {
//   if (currentLevel > 21 || !referrerId) return;
  
//   const User = this;
//   const referrer = await User.findById(referrerId).session(session);
  
//   if (!referrer) return;
  
//   // IMPORTANT: Check if this level's leg is unlocked for the referrer
//   if (!referrer.isLegUnlocked(currentLevel)) {
//     console.log(`❌ Level ${currentLevel} leg not unlocked for ${referrer.userId}, skipping...`);
//     return;
//   }
  
//   console.log(`✅ Adding user to ${referrer.userId}'s level ${currentLevel} (leg unlocked)`);
  
//   // Add user to referrer's level
//   const updateField = `referralTree.level${currentLevel}`;
  
//   await User.findByIdAndUpdate(
//     referrerId,
//     { $addToSet: { [updateField]: userId } },
//     { session }
//   );
  
//   // Update team cashback count
//   await User.findByIdAndUpdate(
//     referrerId,
//     { 
//       $inc: { 
//         [`teamCashback.level${currentLevel}.count`]: 1
//       } 
//     },
//     { session }
//   );
  
//   // IMPORTANT: For direct referrals (Level 1), check if new legs should be unlocked
//   if (currentLevel === 1) {
//     console.log(`🔍 New direct referral added for ${referrer.userId}, checking leg unlocks...`);
//     const updatedReferrer = await User.findById(referrerId).session(session);
//     await updatedReferrer.unlockLegs();
//   }
  
//   // Continue up the tree (uplines)
//   if (referrer.referredBy) {
//     await User.addToReferralTree(userId, referrer.referredBy, currentLevel + 1, session);
//   }
// };

// module.exports = mongoose.model('User', userSchema);


const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ========== LEVEL SCHEMA (inside each leg) ==========
const levelSchema = new mongoose.Schema({
  users: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }], // या level मधील users
  earnings: { 
    type: Number, 
    default: 0 
  }, // या level वरून मिळालेले earnings
  teamCashback: { 
    type: Number, 
    default: 0 
  }, // या level च्या team ने केलेले cashback
  isUnlocked: { 
    type: Boolean, 
    default: false 
  }, // हे level unlock आहे का?
  unlockedAt: { 
    type: Date, 
    default: null 
  }, // केव्हा unlock झालं?
  requiredLevels: [{ 
    type: Number 
  }] // कोणते levels पूर्ण झाले पाहिजेत? (ex: [1,2,3] for level 4)
}, { _id: false });

// ========== LEG SCHEMA (dynamic) ==========
const legSchema = new mongoose.Schema({
  legNumber: { 
    type: Number, 
    required: true 
  }, // Leg क्रमांक (1,2,3,...)
  
  rootUser: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  }, // या leg चा root user (direct referral)
  
  joinedAt: { 
    type: Date, 
    default: Date.now 
  }, // केव्हा join झाला?
  
  isActive: { 
    type: Boolean, 
    default: true 
  }, // Leg active आहे का?
  
  // 21 Levels in each leg
  levels: {
    level1: levelSchema,
    level2: levelSchema,
    level3: levelSchema,
    level4: levelSchema,
    level5: levelSchema,
    level6: levelSchema,
    level7: levelSchema,
    level8: levelSchema,
    level9: levelSchema,
    level10: levelSchema,
    level11: levelSchema,
    level12: levelSchema,
    level13: levelSchema,
    level14: levelSchema,
    level15: levelSchema,
    level16: levelSchema,
    level17: levelSchema,
    level18: levelSchema,
    level19: levelSchema,
    level20: levelSchema,
    level21: levelSchema
  },
  
  // Leg statistics
  stats: {
    totalUsers: { type: Number, default: 1 }, // Leg मधील एकूण users (root सह)
    totalEarnings: { type: Number, default: 0 }, // या leg वरून मिळालेले एकूण earnings
    totalTeamCashback: { type: Number, default: 0 }, // या leg चे एकूण team cashback
    lastActivity: { type: Date, default: Date.now }
  }
}, { _id: true });

// ========== MAIN USER SCHEMA ==========
const userSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  
  pin: { 
    type: String, 
    required: true 
  },

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },

  firstDepositCompleted: { type: Boolean, default: false },
  firstAcceptCompleted: { type: Boolean, default: false },
  totalPayRequests: { type: Number, default: 0 },
  totalAcceptedRequests: { type: Number, default: 0 },

  referralCode: { type: String, unique: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  
  // ========== DYNAMIC LEGS ARRAY ==========
  // प्रत्येक direct referral साठी एक नवीन leg तयार होईल
  legs: [legSchema],
  
  // Direct referrals count (for quick access)
  directReferralsCount: { 
    type: Number, 
    default: 0 
  },
  
  // ========== COMMISSION RATES (21 levels) ==========
  commissionRates: {
    level1: { type: Number, default: 0.30 },  // 30%
    level2: { type: Number, default: 0.15 },  // 15%
    level3: { type: Number, default: 0.10 },  // 10%
    level4: { type: Number, default: 0.05 },  // 5%
    level5: { type: Number, default: 0.30 },  // 30%
    level6: { type: Number, default: 0.03 },  // 3%
    level7: { type: Number, default: 0.04 },  // 4%
    level8: { type: Number, default: 0.03 },  // 3%
    level9: { type: Number, default: 0.03 },  // 3%
    level10: { type: Number, default: 0.30 }, // 30%
    level11: { type: Number, default: 0.03 }, // 3%
    level12: { type: Number, default: 0.03 }, // 3%
    level13: { type: Number, default: 0.03 }, // 3%
    level14: { type: Number, default: 0.03 }, // 3%
    level15: { type: Number, default: 0.03 }, // 3%
    level16: { type: Number, default: 0.05 }, // 5%
    level17: { type: Number, default: 0.10 }, // 10%
    level18: { type: Number, default: 0.15 }, // 15%
    level19: { type: Number, default: 0.30 }, // 30%
    level20: { type: Number, default: 0.30 }, // 30%
    level21: { type: Number, default: 0.63 }  // 63%
  },

  // ========== EARNINGS SUMMARY ==========
  totalEarnings: {
    type: Number,
    default: 0
  },
  
  earningsByLevel: {
    level1: { type: Number, default: 0 },
    level2: { type: Number, default: 0 },
    level3: { type: Number, default: 0 },
    level4: { type: Number, default: 0 },
    level5: { type: Number, default: 0 },
    level6: { type: Number, default: 0 },
    level7: { type: Number, default: 0 },
    level8: { type: Number, default: 0 },
    level9: { type: Number, default: 0 },
    level10: { type: Number, default: 0 },
    level11: { type: Number, default: 0 },
    level12: { type: Number, default: 0 },
    level13: { type: Number, default: 0 },
    level14: { type: Number, default: 0 },
    level15: { type: Number, default: 0 },
    level16: { type: Number, default: 0 },
    level17: { type: Number, default: 0 },
    level18: { type: Number, default: 0 },
    level19: { type: Number, default: 0 },
    level20: { type: Number, default: 0 },
    level21: { type: Number, default: 0 }
  },

  // ========== TEAM STATS ==========
  teamStats: {
    totalTeam: { type: Number, default: 0 },
    activeLegs: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  },

  // Wallet Activation Fields
  walletActivated: { type: Boolean, default: false },
  activationDate: { type: Date, default: null },
  activationExpiryDate: { type: Date, default: null },
  dailyAcceptLimit: { type: Number, default: 1000 },
  
  // 7-Day Limit Fields
  sevenDayTotalAccepted: { type: Number, default: 0 },
  sevenDayResetDate: { type: Date, default: null },
  activationHistory: [{
    date: { type: Date, default: Date.now },
    limit: Number,
    amount: Number,
    expiryDate: Date,
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

// ========== PRE-SAVE HOOKS ==========

// Hash PIN before saving
userSchema.pre('save', async function () {
  if (this.isModified('pin')) {
    const salt = await bcrypt.genSalt(10);
    this.pin = await bcrypt.hash(this.pin, salt);
  }
});

// Generate referral code
userSchema.pre('save', async function () {
  if (this.referralCode) return;

  let code;
  let exists;

  do {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
    exists = await mongoose.models.User.findOne({ referralCode: code });
  } while (exists);

  this.referralCode = code;
});

// ========== STATIC METHODS ==========

/**
 * Commission rates for all levels
 */
userSchema.statics.getCommissionRates = function() {
  return {
    level1: 0.30, level2: 0.15, level3: 0.10, level4: 0.05, level5: 0.30,
    level6: 0.03, level7: 0.04, level8: 0.03, level9: 0.03, level10: 0.30,
    level11: 0.03, level12: 0.03, level13: 0.03, level14: 0.03, level15: 0.03,
    level16: 0.05, level17: 0.10, level18: 0.15, level19: 0.30, level20: 0.30,
    level21: 0.63
  };
};

/**
 * Level unlock requirements (3-level rule)
 * Level 4 साठी levels 1,2,3 पाहिजेत
 * Level 7 साठी levels 4,5,6 पाहिजेत
 */
userSchema.statics.getLevelRequirements = function() {
  const requirements = {};
  
  // Levels 1-3 always unlocked
  requirements[1] = { required: [], isBaseLevel: true };
  requirements[2] = { required: [], isBaseLevel: true };
  requirements[3] = { required: [], isBaseLevel: true };
  
  // Level 4 needs levels 1,2,3
  requirements[4] = { required: [1, 2, 3], isBaseLevel: false };
  
  // Level 5 needs levels 2,3,4
  requirements[5] = { required: [2, 3, 4], isBaseLevel: false };
  
  // Level 6 needs levels 3,4,5
  requirements[6] = { required: [3, 4, 5], isBaseLevel: false };
  
  // Level 7 needs levels 4,5,6
  requirements[7] = { required: [4, 5, 6], isBaseLevel: false };
  
  // Level 8 needs levels 5,6,7
  requirements[8] = { required: [5, 6, 7], isBaseLevel: false };
  
  // Level 9 needs levels 6,7,8
  requirements[9] = { required: [6, 7, 8], isBaseLevel: false };
  
  // Level 10 needs levels 7,8,9
  requirements[10] = { required: [7, 8, 9], isBaseLevel: false };
  
  // Level 11 needs levels 8,9,10
  requirements[11] = { required: [8, 9, 10], isBaseLevel: false };
  
  // Level 12 needs levels 9,10,11
  requirements[12] = { required: [9, 10, 11], isBaseLevel: false };
  
  // Level 13 needs levels 10,11,12
  requirements[13] = { required: [10, 11, 12], isBaseLevel: false };
  
  // Level 14 needs levels 11,12,13
  requirements[14] = { required: [11, 12, 13], isBaseLevel: false };
  
  // Level 15 needs levels 12,13,14
  requirements[15] = { required: [12, 13, 14], isBaseLevel: false };
  
  // Level 16 needs levels 13,14,15
  requirements[16] = { required: [13, 14, 15], isBaseLevel: false };
  
  // Level 17 needs levels 14,15,16
  requirements[17] = { required: [14, 15, 16], isBaseLevel: false };
  
  // Level 18 needs levels 15,16,17
  requirements[18] = { required: [15, 16, 17], isBaseLevel: false };
  
  // Level 19 needs levels 16,17,18
  requirements[19] = { required: [16, 17, 18], isBaseLevel: false };
  
  // Level 20 needs levels 17,18,19
  requirements[20] = { required: [17, 18, 19], isBaseLevel: false };
  
  // Level 21 needs levels 18,19,20
  requirements[21] = { required: [18, 19, 20], isBaseLevel: false };
  
  return requirements;
};

// ========== INSTANCE METHODS ==========

/**
 * Create a new leg when someone joins with referral code
 */
userSchema.methods.createNewLeg = async function(newUserId) {
  const legNumber = this.legs.length + 1;
  
  // Initialize level structure
  const levels = {};
  for (let i = 1; i <= 21; i++) {
    levels[`level${i}`] = {
      users: i === 1 ? [newUserId] : [], // Level 1 मध्ये नवीन user
      earnings: 0,
      teamCashback: 0,
      isUnlocked: i <= 3, // Levels 1-3 always unlocked
      unlockedAt: i <= 3 ? new Date() : null,
      requiredLevels: []
    };
  }
  
  // Create new leg
  const newLeg = {
    legNumber,
    rootUser: newUserId,
    joinedAt: new Date(),
    isActive: true,
    levels,
    stats: {
      totalUsers: 1,
      totalEarnings: 0,
      totalTeamCashback: 0,
      lastActivity: new Date()
    }
  };
  
  this.legs.push(newLeg);
  this.directReferralsCount = this.legs.length;
  this.teamStats.activeLegs = this.legs.length;
  
  await this.save();
  
  return legNumber;
};

/**
 * Add user to referral tree (all legs of upline)
 */
userSchema.statics.addToReferralTree = async function(userId, referrerId, session = null) {
  if (!referrerId) return;
  
  const User = this;
  const referrer = await User.findById(referrerId).session(session);
  
  if (!referrer) return;
  
  console.log(`\n📊 Adding user to ${referrer.userId}'s tree`);
  console.log(`   Total legs: ${referrer.legs.length}`);
  
  // प्रत्येक leg मध्ये user ला योग्य level वर add करा
  for (let legIndex = 0; legIndex < referrer.legs.length; legIndex++) {
    const leg = referrer.legs[legIndex];
    
    // Find the first available level in this leg
    for (let levelNum = 1; levelNum <= 21; levelNum++) {
      const levelKey = `level${levelNum}`;
      const level = leg.levels[levelKey];
      
      // Check if this level is unlocked
      if (!level.isUnlocked) continue;
      
      // Check if user already exists in this level
      if (level.users.includes(userId)) break;
      
      // Add user to this level
      level.users.push(userId);
      
      // Update leg stats
      leg.stats.totalUsers++;
      leg.stats.lastActivity = new Date();
      
      console.log(`   ✅ Added to Leg ${leg.legNumber} - Level ${levelNum}`);
      
      // Check if this addition unlocks new levels
      await referrer.checkAndUnlockLevels(legIndex);
      
      break; // Move to next leg after adding
    }
  }
  
  // Update referrer's team stats
  referrer.teamStats.totalTeam++;
  referrer.teamStats.lastUpdated = new Date();
  
  await referrer.save({ session });
  
  // Continue up the tree
  if (referrer.referredBy) {
    await User.addToReferralTree(userId, referrer.referredBy, session);
  }
};

/**
 * Check and unlock levels in a specific leg based on 3-level rule
 */
userSchema.methods.checkAndUnlockLevels = async function(legIndex) {
  const leg = this.legs[legIndex];
  if (!leg) return false;
  
  const requirements = this.constructor.getLevelRequirements();
  let unlockedAny = false;
  
  for (let levelNum = 4; levelNum <= 21; levelNum++) {
    const levelKey = `level${levelNum}`;
    const level = leg.levels[levelKey];
    
    // Skip if already unlocked
    if (level.isUnlocked) continue;
    
    const requirement = requirements[levelNum];
    let canUnlock = true;
    
    // Check if all required levels have users
    for (const reqLevel of requirement.required) {
      const reqLevelKey = `level${reqLevel}`;
      if (leg.levels[reqLevelKey].users.length === 0) {
        canUnlock = false;
        break;
      }
    }
    
    if (canUnlock) {
      level.isUnlocked = true;
      level.unlockedAt = new Date();
      level.requiredLevels = requirement.required;
      unlockedAny = true;
      
      console.log(`   🔓 Leg ${leg.legNumber} - Level ${levelNum} unlocked!`);
    }
  }
  
  if (unlockedAny) {
    await this.save();
  }
  
  return unlockedAny;
};

/**
 * Calculate earnings for a transaction
 */
userSchema.methods.calculateEarnings = async function(transactionAmount, downlineUserId, session = null) {
  let totalEarning = 0;
  
  // Find which leg contains this downline user
  for (let legIndex = 0; legIndex < this.legs.length; legIndex++) {
    const leg = this.legs[legIndex];
    
    for (let levelNum = 1; levelNum <= 21; levelNum++) {
      const levelKey = `level${levelNum}`;
      const level = leg.levels[levelKey];
      
      if (level.users.includes(downlineUserId)) {
        // Found the user in this leg at this level
        const rate = this.commissionRates[`level${levelNum}`] || 0;
        const earning = transactionAmount * rate;
        
        // Update level earnings
        level.earnings = (level.earnings || 0) + earning;
        
        // Update leg stats
        leg.stats.totalEarnings = (leg.stats.totalEarnings || 0) + earning;
        leg.stats.lastActivity = new Date();
        
        // Update user totals
        this.totalEarnings = (this.totalEarnings || 0) + earning;
        this.earningsByLevel[`level${levelNum}`] = 
          (this.earningsByLevel[`level${levelNum}`] || 0) + earning;
        
        totalEarning += earning;
        
        console.log(`💰 Leg ${leg.legNumber} Level ${levelNum}: ₹${earning} (${rate*100}%)`);
        break;
      }
    }
  }
  
  await this.save({ session });
  return totalEarning;
};

/**
 * Get leg summary
 */
userSchema.methods.getLegSummary = function() {
  const summary = {
    totalLegs: this.legs.length,
    directReferrals: this.directReferralsCount,
    legs: []
  };
  
  for (let i = 0; i < this.legs.length; i++) {
    const leg = this.legs[i];
    const legSummary = {
      legNumber: leg.legNumber,
      rootUser: leg.rootUser,
      joinedAt: leg.joinedAt,
      totalUsers: leg.stats.totalUsers,
      totalEarnings: leg.stats.totalEarnings,
      totalTeamCashback: leg.stats.totalTeamCashback,
      levels: {}
    };
    
    // Get level-wise data
    for (let levelNum = 1; levelNum <= 21; levelNum++) {
      const levelKey = `level${levelNum}`;
      const level = leg.levels[levelKey];
      
      legSummary.levels[`level${levelNum}`] = {
        users: level.users.length,
        earnings: level.earnings,
        teamCashback: level.teamCashback,
        isUnlocked: level.isUnlocked,
        unlockedAt: level.unlockedAt
      };
    }
    
    summary.legs.push(legSummary);
  }
  
  return summary;
};

/**
 * Get team summary with all levels
 */
userSchema.methods.getTeamSummary = function() {
  const summary = {
    totalLegs: this.legs.length,
    directReferrals: this.directReferralsCount,
    totalTeam: this.teamStats.totalTeam,
    earningsByLevel: this.earningsByLevel,
    totalEarnings: this.totalEarnings,
    levels: {}
  };
  
  // Initialize level counts
  for (let levelNum = 1; levelNum <= 21; levelNum++) {
    summary.levels[`level${levelNum}`] = {
      users: 0,
      earnings: this.earningsByLevel[`level${levelNum}`] || 0,
      unlockedLegs: 0
    };
  }
  
  // Aggregate data from all legs
  for (const leg of this.legs) {
    for (let levelNum = 1; levelNum <= 21; levelNum++) {
      const levelKey = `level${levelNum}`;
      const level = leg.levels[levelKey];
      
      summary.levels[`level${levelNum}`].users += level.users.length;
      if (level.isUnlocked) {
        summary.levels[`level${levelNum}`].unlockedLegs++;
      }
    }
  }
  
  return summary;
};

/**
 * Check if a specific level is accessible in any leg
 */
userSchema.methods.isLevelAccessible = function(level) {
  for (const leg of this.legs) {
    const levelKey = `level${level}`;
    if (leg.levels[levelKey]?.isUnlocked) {
      return true;
    }
  }
  return level <= 3; // Levels 1-3 always accessible
};

// Activation methods (unchanged)
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

module.exports = mongoose.model('User', userSchema);