

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

// Hook 1: Hash PIN
userSchema.pre('save', async function() {
  if (this.isModified('pin')) {
    const salt = await bcrypt.genSalt(10);
    this.pin = await bcrypt.hash(this.pin, salt);
  }
});

// Hook 2: Generate referral code
userSchema.pre('save', async function() {
  if (this.referralCode) return;

  let code;
  let exists;
  const User = mongoose.model('User');

  do {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
    exists = await User.findOne({ referralCode: code });
  } while (exists);

  this.referralCode = code;
});



userSchema.methods.addNotification = function(type, message, legNumber, level = null, data = {}) {
  if (!this.notifications) this.notifications = [];
  this.notifications.push({ type, message, legNumber, level, data, read: false, createdAt: new Date() });
  console.log(`🔔 Notification added: ${message}`);
};

// ✅ NEW — हे paste कर
userSchema.methods.createNewLeg = async function(newUserId, session = null) {
  const legNumber = this.legs.length + 1;
  const unlockedLevelsCount = legNumber; // FIX: push होण्याआधी +1 केला होता, आता legNumber = new count
  const levels = {};

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

  const saveOpts = session ? { session } : {};
  await this.save(saveOpts);
  console.log(`   ✅ Leg ${legNumber} created, levels 1-${unlockedLevelsCount} unlocked`);
  return legNumber;
};

// ✅ NEW — फक्त signature आणि save line बदलतो
userSchema.methods.updateAllLegsUnlocks = async function(session = null) {
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

  const saveOpts = session ? { session } : {};
  await this.save(saveOpts);
  return { success: true, unlockedCount: newlyUnlocked.length, newlyUnlocked, currentUnlockedLevels: directReferralsCount };
};

// ✅ NEW
userSchema.methods.processDirectReferral = async function(newUserId, session = null) {
  const legNumber = await this.createNewLeg(newUserId, session);
  const unlockResult = await this.updateAllLegsUnlocks(session);
  return { success: true, legNumber, unlockedLevels: unlockResult.currentUnlockedLevels, newlyUnlocked: unlockResult.newlyUnlocked };
};

// ✅ NEW — पूर्णपणे replace कर
userSchema.statics.addToReferralTree = async function(userId, referrerId, session = null) {
  if (!referrerId) return;
  const User = this;
  const referrer = await User.findById(referrerId).session(session);
  const newUser = await User.findById(userId).session(session);
  if (!referrer) return;

  const isDirectReferral = newUser &&
    newUser.referredBy &&
    newUser.referredBy.toString() === referrer._id.toString();

  if (isDirectReferral) {
    // FIX: session pass करतो
    await referrer.processDirectReferral(userId, session);

  } else {
    // FIX: parent कुठल्या leg मध्ये आहे ते शोधून त्याच leg मध्ये add करतो
    const parentId = newUser ? newUser.referredBy : null;
    let placed = false;

    for (let legIndex = 0; legIndex < referrer.legs.length; legIndex++) {
      const leg = referrer.legs[legIndex];

      // parent या leg मध्ये आहे का ते check कर
      let parentInThisLeg = false;

      if (leg.rootUser && leg.rootUser.toString() === (parentId ? parentId.toString() : '')) {
        parentInThisLeg = true;
      }

      if (!parentInThisLeg) {
        for (let lvl = 1; lvl <= 21; lvl++) {
          const levelUsers = leg.levels[`level${lvl}`]?.users || [];
          // FIX: .toString() comparison — .includes() ObjectId वर काम करत नाही
          if (levelUsers.some(u => u.toString() === (parentId ? parentId.toString() : ''))) {
            parentInThisLeg = true;
            break;
          }
        }
      }

      if (!parentInThisLeg) continue;

      // parent चा depth शोध
      let parentDepth = 0;
      if (leg.rootUser && leg.rootUser.toString() === (parentId ? parentId.toString() : '')) {
        parentDepth = 1;
      } else {
        for (let lvl = 1; lvl <= 21; lvl++) {
          const levelUsers = leg.levels[`level${lvl}`]?.users || [];
          if (levelUsers.some(u => u.toString() === (parentId ? parentId.toString() : ''))) {
            parentDepth = lvl;
            break;
          }
        }
      }

      const targetLevel = parentDepth + 1;
      if (targetLevel > 21) {
        console.log(`⚠️ Max depth (21) reached in Leg ${leg.legNumber}`);
        break;
      }

      const targetLevelData = leg.levels[`level${targetLevel}`];
if (
  targetLevelData &&
  !targetLevelData.users.some(u => u.toString() === userId.toString())
) {
        targetLevelData.users.push(userId);
        leg.stats.totalUsers++;
        leg.stats.lastActivity = new Date();
        referrer.addNotification(
          'NEW_USER_ADDED',
          `New user added to Leg ${leg.legNumber} at Level ${targetLevel}`,
          leg.legNumber, targetLevel, { userId, isIndirect: true }
        );
        placed = true;
      }
      break;
    }

    if (!placed) {
      console.log(`⚠️ Could not place user ${userId} under ${referrer.userId}`);
    }

    referrer.teamStats.totalTeam = (referrer.teamStats.totalTeam || 0) + 1;
    referrer.teamStats.lastUpdated = new Date();
    const saveOpts = session ? { session } : {};
    await referrer.save(saveOpts);
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