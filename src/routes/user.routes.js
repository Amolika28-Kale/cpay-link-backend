
/// routes/userAuth.routes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { 
  register, 
  login,
  getReferralStats,
  getLegDetails,
  getNotifications,
  markNotificationRead
} = require('../controllers/userAuth.controller');
const userAuth = require("../middlewares/userAuth.middleware");
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const ReferralService = require('../../services/referralService');

// Auth Routes
router.post('/register', register);
router.post('/login', login);
router.get('/referral', userAuth, getReferralStats);
router.get('/leg/:legNumber', userAuth, getLegDetails);
router.get('/notifications', userAuth, getNotifications);
router.post('/notifications/:notificationId/read', userAuth, markNotificationRead);

// ========== SIMPLIFIED: GET LEG UNLOCKING STATUS ==========
router.get('/leg-status', userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const directReferralsCount = user.legs?.length || 0;
    const unlockedLevelsCount = directReferralsCount; // SIMPLE: direct referrals = unlocked levels
    
    // Level accessibility - SIMPLE: level <= directReferralsCount
    const levelAccessibility = {};
    for (let level = 1; level <= 21; level++) {
      const isAccessible = level <= directReferralsCount;
      
      // Count users at this level across all legs
      let usersCount = 0;
      for (let legIndex = 0; legIndex < (user.legs || []).length; legIndex++) {
        const leg = user.legs[legIndex];
        const levelKey = `level${level}`;
        if (leg.levels?.[levelKey]) {
          usersCount += leg.levels[levelKey].users?.length || 0;
        }
      }
      
      levelAccessibility[`level${level}`] = {
        isAccessible,
        usersCount,
        commission: user.commissionRates?.[`level${level}`] || 0,
        isUnlocked: level <= directReferralsCount // All legs have same unlocked levels
      };
    }
    
    // Leg details - SIMPLE: all legs have same unlocked levels
    const legDetails = {};
    for (let i = 0; i < (user.legs || []).length; i++) {
      const leg = user.legs[i];
      
      // Level status for this leg
      const levelStatus = {};
      for (let level = 1; level <= 21; level++) {
        const levelData = leg.levels?.[`level${level}`];
        levelStatus[`level${level}`] = {
          users: levelData?.users?.length || 0,
          isUnlocked: level <= directReferralsCount, // SIMPLE: unlocked based on direct referrals
          earnings: levelData?.earnings || 0,
          teamCashback: levelData?.teamCashback || 0
        };
      }
      
      legDetails[`leg${i+1}`] = {
        legNumber: leg.legNumber,
        rootUser: leg.rootUser,
        joinedAt: leg.joinedAt,
        totalUsers: leg.stats?.totalUsers || 0,
        totalEarnings: leg.stats?.totalEarnings || 0,
        unlockedLevels: unlockedLevelsCount, // All legs have same unlocked levels
        isFullyUnlocked: unlockedLevelsCount === 21,
        levels: levelStatus
      };
    }
    
    // Next level to unlock - SIMPLE: next level = directReferralsCount + 1
    const nextLevelToUnlock = directReferralsCount < 21 ? {
      level: directReferralsCount + 1,
      requiredDirects: directReferralsCount + 1,
      currentDirects: directReferralsCount,
      remainingDirects: 1, // Always need 1 more direct referral
      levelsToUnlock: [directReferralsCount + 1],
      message: `Add 1 direct referral to unlock Level ${directReferralsCount + 1} in all ${user.legs.length} legs`
    } : null;
    
    const legStatus = {
      success: true,
      data: {
        userId: user.userId,
        directReferrals: directReferralsCount,
        totalLegs: user.legs.length,
        unlockedLevelsInEachLeg: unlockedLevelsCount,
        levelAccessibility,
        legDetails,
        nextLevelToUnlock,
        summary: `You have ${directReferralsCount} direct referral${directReferralsCount !== 1 ? 's' : ''} (${user.legs.length} leg${user.legs.length !== 1 ? 's' : ''}). `
      }
    };

    if (nextLevelToUnlock) {
      legStatus.data.summary += `Next: Add 1 direct referral to unlock Level ${nextLevelToUnlock.level} in all legs.`;
    } else {
      legStatus.data.summary += `🎉 All 21 levels are unlocked in all legs! Great job!`;
    }

    res.json(legStatus);
    
  } catch (error) {
    console.error("Leg status error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== SIMPLIFIED: GET NEXT LEVEL REQUIREMENT ==========
router.get('/next-level-requirement', userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const directReferrals = user.legs?.length || 0;
    
    if (directReferrals >= 21) {
      return res.json({
        success: true,
        data: {
          message: "🎉 All 21 levels unlocked in all legs!",
          completed: true,
          directReferrals,
          totalLegs: user.legs.length
        }
      });
    }
    
    const nextLevel = directReferrals + 1;
    
    res.json({
      success: true,
      data: {
        currentDirects: directReferrals,
        nextLevel,
        requiredDirects: nextLevel,
        remainingDirects: 1,
        totalLegs: user.legs.length,
        levelsToUnlock: [nextLevel],
        message: `Add 1 direct referral to unlock Level ${nextLevel} in all ${user.legs.length} legs`,
        isUnlockable: true // Always unlockable with 1 more direct referral
      }
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== GET MEMBER DETAILS WITH SIMPLIFIED LOGIC ==========
router.get('/member-details/:memberId', userAuth, async (req, res) => {
  try {
    const { memberId } = req.params;
    const currentUserId = req.user.id;
    
    console.log("🔍 Fetching member details for ID:", memberId);
    
    // Validate memberId
    if (!memberId || memberId === 'undefined' || memberId === 'null') {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid member ID" 
      });
    }

    // Find member by various methods
    let member = null;
    
    // Method 1: Try to find by _id (ObjectId)
    if (mongoose.Types.ObjectId.isValid(memberId)) {
      member = await User.findById(memberId);
    }
    
    // Method 2: If not found, try to find by userId
    if (!member) {
      member = await User.findOne({ userId: memberId.toString() });
    }
    
    if (!member) {
      return res.status(404).json({ 
        success: false, 
        message: "Member not found" 
      });
    }
    
    console.log(`✅ Member found: ${member.userId}`);
    
    const directReferralsCount = member.legs?.length || 0;
    const unlockedLevelsCount = directReferralsCount;
    
    // Calculate team cashback from all legs
    let teamCashbackTotal = 0;
    for (const leg of member.legs || []) {
      for (let level = 1; level <= 21; level++) {
        teamCashbackTotal += leg.levels?.[`level${level}`]?.teamCashback || 0;
      }
    }
    
    // Calculate total team members
    let totalTeam = 0;
    const downlineCount = {};
    
    for (let level = 1; level <= 21; level++) {
      let usersAtLevel = 0;
      for (const leg of member.legs || []) {
        usersAtLevel += leg.levels?.[`level${level}`]?.users?.length || 0;
      }
      downlineCount[`level${level}`] = usersAtLevel;
      totalTeam += usersAtLevel;
    }
    
    // Get level-wise earnings
    const levelEarnings = {};
    for (let level = 1; level <= 21; level++) {
      levelEarnings[`level${level}`] = member.earningsByLevel?.[`level${level}`] || 0;
    }
    
    // Leg status - SIMPLE: all legs have same unlocked levels
    const legsStatus = {};
    for (let i = 0; i < (member.legs || []).length; i++) {
      const leg = member.legs[i];
      
      legsStatus[`leg${i+1}`] = {
        legNumber: leg.legNumber,
        rootUser: leg.rootUser,
        totalUsers: leg.stats?.totalUsers || 0,
        totalEarnings: leg.stats?.totalEarnings || 0,
        unlockedLevels: unlockedLevelsCount,
        isFullyUnlocked: unlockedLevelsCount === 21
      };
    }
    
    // Level accessibility - SIMPLE
    const levelAccessibility = {};
    for (let level = 1; level <= 21; level++) {
      levelAccessibility[`level${level}`] = level <= directReferralsCount;
    }
    
    const memberDetails = {
      // Basic Info
      _id: member._id,
      userId: member.userId || 'Unknown',
      email: member.email || 'N/A',
      joinedAt: member.createdAt || null,
      
      // Earnings
      totalEarnings: member.totalEarnings || 0,
      teamCashback: teamCashbackTotal,
      levelEarnings: levelEarnings,
      
      // Team Stats
      directReferrals: directReferralsCount,
      totalTeam: totalTeam,
      downlineCount: downlineCount,
      
      // Leg Status
      totalLegs: member.legs?.length || 0,
      unlockedLevelsInEachLeg: unlockedLevelsCount,
      legsStatus: legsStatus,
      levelAccessibility: levelAccessibility,
      
      // Relationship with current user
      relationship: {
        isCurrentUser: member._id.toString() === currentUserId,
        isInDownline: false,
        downlineLevel: null
      },
      
      recentActivity: []
    };
    
    // Check if this member is in current user's downline
    const currentUser = await User.findById(currentUserId);
    if (currentUser && member._id.toString() !== currentUserId) {
      for (let level = 1; level <= 21; level++) {
        for (const leg of currentUser.legs || []) {
if (leg.levels?.[`level${level}`]?.users?.some(u => u.toString() === member._id.toString())) {
              memberDetails.relationship.isInDownline = true;
            memberDetails.relationship.downlineLevel = level;
            break;
          }
        }
        if (memberDetails.relationship.isInDownline) break;
      }
    }
    
    // Get recent transactions
    try {
      const recentTx = await Transaction.find({ user: member._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
        
      memberDetails.recentActivity = recentTx.map(tx => ({
        date: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-IN') : 'N/A',
        amount: tx.amount || 0,
        type: tx.type || 'UNKNOWN',
        description: tx.meta?.description || tx.type
      }));
    } catch (txError) {
      console.log("No transactions found:", txError.message);
      memberDetails.recentActivity = [];
    }
    
    res.json({
      success: true,
      data: memberDetails
    });
    
  } catch (error) {
    console.error("❌ Error in getMemberDetails:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Internal server error" 
    });
  }
});

// ========== SIMPLIFIED: GET TEAM SUMMARY ==========
router.get('/team-summary', userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const directReferralsCount = user.legs?.length || 0;
    const unlockedLevelsCount = directReferralsCount;
    
    // Calculate total team
    let totalTeam = 0;
    const levelWiseUsers = {};
    
    for (let level = 1; level <= 21; level++) {
      let usersAtLevel = 0;
      for (const leg of user.legs || []) {
        usersAtLevel += leg.levels?.[`level${level}`]?.users?.length || 0;
      }
      levelWiseUsers[`level${level}`] = usersAtLevel;
      totalTeam += usersAtLevel;
    }
    
    const teamSummary = {
      totalLegs: user.legs?.length || 0,
      directReferrals: directReferralsCount,
      unlockedLevelsInEachLeg: unlockedLevelsCount,
      totalTeam: totalTeam,
      totalEarnings: user.totalEarnings || 0,
      levelWiseUsers,
      earningsByLevel: user.earningsByLevel || {},
      isFullyUnlocked: unlockedLevelsCount === 21,
      nextLevel: directReferralsCount < 21 ? directReferralsCount + 1 : null
    };
    
    res.json({
      success: true,
      data: teamSummary
    });
    
  } catch (error) {
    console.error("Team summary error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== SIMPLIFIED: GET LEG-WISE BREAKDOWN ==========
router.get('/leg-breakdown', userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const directReferralsCount = user.legs?.length || 0;
    
    const legSummary = {
      totalLegs: user.legs?.length || 0,
      directReferrals: directReferralsCount,
      unlockedLevelsInEachLeg: directReferralsCount,
      legs: (user.legs || []).map(leg => {
        // Level-wise data for this leg
        const levels = {};
        for (let level = 1; level <= 21; level++) {
          const levelData = leg.levels?.[`level${level}`];
          levels[`level${level}`] = {
            users: levelData?.users?.length || 0,
            earnings: levelData?.earnings || 0,
            teamCashback: levelData?.teamCashback || 0,
            isUnlocked: level <= directReferralsCount // SIMPLE check
          };
        }
        
        return {
          legNumber: leg.legNumber,
          rootUser: leg.rootUser,
          joinedAt: leg.joinedAt,
          totalUsers: leg.stats?.totalUsers || 0,
          totalEarnings: leg.stats?.totalEarnings || 0,
          unlockedLevels: directReferralsCount, // All legs same
          isFullyUnlocked: directReferralsCount === 21,
          levels
        };
      })
    };
    
    res.json({
      success: true,
      data: legSummary
    });
    
  } catch (error) {
    console.error("Leg breakdown error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== SIMPLIFIED: GET USERS AT SPECIFIC LEVEL ==========
router.get('/level-users/:level', userAuth, async (req, res) => {
  try {
    const { level } = req.params;
    const levelNum = parseInt(level);
    
    if (levelNum < 1 || levelNum > 21) {
      return res.status(400).json({ 
        success: false, 
        message: "Level must be between 1 and 21" 
      });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const directReferralsCount = user.legs?.length || 0;
    const isAccessible = levelNum <= directReferralsCount;
    
    // Get all users at this level from all legs
    const levelKey = `level${levelNum}`;
    const userIds = [];
    const legMap = {};
    
    for (let i = 0; i < (user.legs || []).length; i++) {
      const leg = user.legs[i];
      const usersAtLevel = leg.levels?.[levelKey]?.users || [];
      
      usersAtLevel.forEach(uid => {
        userIds.push(uid);
        legMap[uid.toString()] = leg.legNumber;
      });
    }
    
    // Get user details
    const users = await User.find(
      { _id: { $in: userIds } },
      'userId email totalEarnings createdAt'
    ).lean();
    
    const userList = users.map(u => ({
      userId: u.userId,
      email: u.email,
      earnings: u.totalEarnings || 0,
      legNumber: legMap[u._id.toString()] || 0,
      joinedAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : 'N/A'
    }));
    
    res.json({
      success: true,
      data: {
        level: levelNum,
        isAccessible,
        requiredDirects: levelNum,
        currentDirects: directReferralsCount,
        totalUsers: userList.length,
        users: userList
      }
    });
    
  } catch (error) {
    console.error("Error getting level users:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== SIMPLIFIED: GET LEG-WISE USERS ==========
router.get('/leg-users/:legNumber/:level', userAuth, async (req, res) => {
  try {
    const { legNumber, level } = req.params;
    const legNum = parseInt(legNumber);
    const levelNum = parseInt(level);
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const directReferralsCount = user.legs?.length || 0;
    
    // Find the specific leg
    const leg = user.legs?.find(l => l.legNumber === legNum);
    
    if (!leg) {
      return res.status(404).json({ success: false, message: "Leg not found" });
    }
    
    // Get users at this level in this leg
    const levelKey = `level${levelNum}`;
    const userIds = leg.levels?.[levelKey]?.users || [];
    
    if (userIds.length === 0) {
      return res.json({
        success: true,
        data: {
          legNumber: legNum,
          level: levelNum,
          totalUsers: 0,
          isUnlocked: levelNum <= directReferralsCount,
          users: []
        }
      });
    }
    
    // Get full user details for these IDs
    const users = await User.find(
      { _id: { $in: userIds } },
      'userId email totalEarnings createdAt'
    ).lean();
    
    const usersList = users.map(u => ({
      _id: u._id,
      userId: u.userId,
      email: u.email,
      totalEarnings: u.totalEarnings || 0,
      joinedAt: u.createdAt
    }));
    
    res.json({
      success: true,
      data: {
        legNumber: legNum,
        level: levelNum,
        totalUsers: usersList.length,
        isUnlocked: levelNum <= directReferralsCount,
        earnings: leg.levels?.[levelKey]?.earnings || 0,
        teamCashback: leg.levels?.[levelKey]?.teamCashback || 0,
        users: usersList
      }
    });
    
  } catch (error) {
    console.error("Error fetching leg users:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== SIMPLIFIED: GET TODAY'S TEAM STATS ==========
router.get('/today-team-stats', userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get all users in downline
    const allDownlineIds = [];
    for (const leg of user.legs || []) {
      for (let level = 1; level <= 21; level++) {
        const usersAtLevel = leg.levels?.[`level${level}`]?.users || [];
        allDownlineIds.push(...usersAtLevel);
      }
    }
    
    // Get today's transactions for these users
    const todayTransactions = await Transaction.find({
      user: { $in: allDownlineIds },
      createdAt: { $gte: today, $lt: tomorrow },
      type: { $in: ['DEPOSIT', 'CREDIT'] }
    });
    
    const teamBusiness = todayTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    
    // Calculate your commission (simplified - average 10% of team business)
    const yourCommission = teamBusiness * 0.1;
    
    // Count active members today
    const activeMemberIds = new Set();
    todayTransactions.forEach(tx => activeMemberIds.add(tx.user.toString()));
    
    res.json({
      success: true,
      data: {
        teamBusiness,
        yourCommission,
        teamMembers: activeMemberIds.size,
        transactions: todayTransactions.length
      }
    });
    
  } catch (error) {
    console.error("Error fetching today's stats:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== SIMPLIFIED: GET UNLOCK STATUS (renamed from pending-unlocks) ==========
router.get('/unlock-status-simple', userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const directReferralsCount = user.legs?.length || 0;
    
    const status = {
      currentDirects: directReferralsCount,
      totalLegs: user.legs.length,
      unlockedLevelsInEachLeg: directReferralsCount,
      isFullyUnlocked: directReferralsCount === 21,
      nextLevelToUnlock: directReferralsCount < 21 ? directReferralsCount + 1 : null,
      progress: Math.round((directReferralsCount / 21) * 100) + '%',
      legs: user.legs.map(leg => ({
        legNumber: leg.legNumber,
        totalUsers: leg.stats?.totalUsers || 0,
        unlockedLevels: directReferralsCount
      }))
    };
    
    res.json({
      success: true,
      data: status
    });
    
  } catch (error) {
    console.error("Error fetching unlock status:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;