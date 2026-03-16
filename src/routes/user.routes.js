// // routes/userAuth.routes.js
// const express = require('express');
// const router = express.Router();
// const mongoose = require('mongoose'); // ✅ IMPORTANT: mongoose import करा
// const { 
//   register, 
//   login,
//   getReferralStats, 
// } = require('../controllers/userAuth.controller');
// const userAuth = require("../middlewares/userAuth.middleware");
// const User = require('../models/User');
// const Transaction = require('../models/Transaction'); // ✅ Transaction model import करा

// // Auth Routes
// router.post('/register', register);
// router.post('/login', login);
// router.get('/referral', userAuth, getReferralStats);

// // Get leg unlocking status - CORRECTED
// router.get('/leg-status', userAuth, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
    
//     const directReferralsCount = user.referralTree?.level1?.length || 0;
//     const requirements = User.getLegRequirements();
//     const nextLeg = user.getNextLegToUnlock();
    
//     const legStatus = {
//       directReferrals: directReferralsCount,
//       legsUnlocked: user.legsUnlocked,
//       legDetails: {
//         leg1: { 
//           unlocked: user.legsUnlocked.leg1, 
//           levels: requirements.leg1.levels,
//           requirement: `Need ${requirements.leg1.required} direct referral`,
//           current: directReferralsCount,
//           needed: requirements.leg1.required,
//           remaining: Math.max(0, requirements.leg1.required - directReferralsCount)
//         },
//         leg2: { 
//           unlocked: user.legsUnlocked.leg2, 
//           levels: requirements.leg2.levels,
//           requirement: `Need ${requirements.leg2.required} direct referrals`,
//           current: directReferralsCount,
//           needed: requirements.leg2.required,
//           remaining: Math.max(0, requirements.leg2.required - directReferralsCount)
//         },
//         leg3: { 
//           unlocked: user.legsUnlocked.leg3, 
//           levels: requirements.leg3.levels,
//           requirement: `Need ${requirements.leg3.required} direct referrals`,
//           current: directReferralsCount,
//           needed: requirements.leg3.required,
//           remaining: Math.max(0, requirements.leg3.required - directReferralsCount)
//         },
//         leg4: { 
//           unlocked: user.legsUnlocked.leg4, 
//           levels: requirements.leg4.levels,
//           requirement: `Need ${requirements.leg4.required} direct referrals`,
//           current: directReferralsCount,
//           needed: requirements.leg4.required,
//           remaining: Math.max(0, requirements.leg4.required - directReferralsCount)
//         },
//         leg5: { 
//           unlocked: user.legsUnlocked.leg5, 
//           levels: requirements.leg5.levels,
//           requirement: `Need ${requirements.leg5.required} direct referrals`,
//           current: directReferralsCount,
//           needed: requirements.leg5.required,
//           remaining: Math.max(0, requirements.leg5.required - directReferralsCount)
//         },
//         leg6: { 
//           unlocked: user.legsUnlocked.leg6, 
//           levels: requirements.leg6.levels,
//           requirement: `Need ${requirements.leg6.required} direct referrals`,
//           current: directReferralsCount,
//           needed: requirements.leg6.required,
//           remaining: Math.max(0, requirements.leg6.required - directReferralsCount)
//         },
//         leg7: { 
//           unlocked: user.legsUnlocked.leg7, 
//           levels: requirements.leg7.levels,
//           requirement: `Need ${requirements.leg7.required} direct referrals`,
//           current: directReferralsCount,
//           needed: requirements.leg7.required,
//           remaining: Math.max(0, requirements.leg7.required - directReferralsCount)
//         }
//       },
//       nextLegToUnlock: nextLeg,
//       summary: `You have ${directReferralsCount} direct referral${directReferralsCount !== 1 ? 's' : ''}. `
//     };

//     if (nextLeg) {
//       legStatus.summary += `Need ${nextLeg.remaining} more direct referral${nextLeg.remaining > 1 ? 's' : ''} to unlock ${nextLeg.leg} (levels ${nextLeg.levels.join('-')}).`;
//     } else {
//       legStatus.summary += `All legs unlocked! Great job!`;
//     }

//     res.json(legStatus);
//   } catch (error) {
//     console.error("Leg status error:", error);
//     res.status(500).json({ error: error.message });
//   }
// });

// // Get next leg requirement - CORRECTED
// router.get('/next-leg-requirement', userAuth, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
    
//     const nextLeg = user.getNextLegToUnlock();

//     res.json({
//       success: true,
//       data: {
//         userId: user.userId,
//         directReferrals: user.referralTree?.level1?.length || 0,
//         legsUnlocked: user.legsUnlocked,
//         nextLegToUnlock: nextLeg,
//         summary: nextLeg ? 
//           (nextLeg.isUnlockable ? 
//             `You can unlock ${nextLeg.leg} now!` : 
//             `Need ${nextLeg.remaining} more direct referral${nextLeg.remaining > 1 ? 's' : ''} to unlock ${nextLeg.leg} (levels ${nextLeg.levels.join('-')})`) :
//           'All legs unlocked! Great job!'
//       }
//     });

//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// });
// // Get member details - FIXED VERSION
// router.get('/member-details/:memberId', userAuth, async (req, res) => {
//   try {
//     const { memberId } = req.params;
//     // console.log("🔍 Fetching member details for ID:", memberId);
    
//     // Validate memberId
//     if (!memberId || memberId === 'undefined' || memberId === 'null') {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Invalid member ID" 
//       });
//     }

//     // ✅ FIX: Check if memberId is a valid ObjectId
//     // MongoDB ObjectId is 24 characters hex string
//     // But we also need to handle numeric userIds (like 334317)
    
//     let member = null;
    
//     // Try to find by _id (ObjectId) first
//     if (mongoose.Types.ObjectId.isValid(memberId)) {
//       member = await User.findById(memberId);
//     }
    
//     // If not found by _id, try to find by userId (numeric string)
//     if (!member) {
//       member = await User.findOne({ userId: memberId });
//     }
    
//     // If still not found, try to find by userId as number (if it's numeric)
//     if (!member && /^\d+$/.test(memberId)) {
//       member = await User.findOne({ userId: memberId });
//     }
    
//     if (!member) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Member not found" 
//       });
//     }
    
//     // Get member's details with safe defaults
//     const memberDetails = {
//       userId: member.userId || 'Unknown',
//       totalEarnings: member.referralEarnings?.total || 0,
//       teamCashback: 0,
//       directReferrals: member.referralTree?.level1?.length || 0,
//       totalTeam: 0,
//       legsUnlocked: member.legsUnlocked || {
//         leg1: true, leg2: false, leg3: false, 
//         leg4: false, leg5: false, leg6: false, leg7: false
//       },
//       levelEarnings: member.referralEarnings || {},
//       downlineCount: {},
//       recentActivity: []
//     };
    
//     // Calculate team cashback safely
//     try {
//       if (member.teamCashback) {
//         memberDetails.teamCashback = Object.values(member.teamCashback).reduce(
//           (sum, level) => sum + (level?.total || 0), 0
//         );
//       }
//     } catch (e) {
//       // console.log("Error calculating team cashback:", e);
//     }
    
//     // Calculate total team safely
//     try {
//       if (member.referralTree) {
//         memberDetails.totalTeam = Object.values(member.referralTree).reduce(
//           (sum, level) => sum + (level?.length || 0), 0
//         );
//       }
//     } catch (e) {
//       // console.log("Error calculating total team:", e);
//     }
    
//     // Get downline counts safely
//     try {
//       for (let level = 1; level <= 7; level++) {
//         memberDetails.downlineCount[`level${level}`] = 
//           member.referralTree?.[`level${level}`]?.length || 0;
//       }
//     } catch (e) {
//       // console.log("Error getting downline counts:", e);
//     }
    
//     // Get recent transactions safely
//     try {
//       const Transaction = mongoose.model('Transaction');
//       const recentTx = await Transaction.find({ user: member._id })
//         .sort({ createdAt: -1 })
//         .limit(5)
//         .lean();
        
//       memberDetails.recentActivity = recentTx.map(tx => ({
//         date: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A',
//         amount: tx.amount || 0,
//         type: tx.type || 'UNKNOWN'
//       }));
//     } catch (txError) {
//       // console.log("No transactions found:", txError.message);
//       memberDetails.recentActivity = [];
//     }
    
//     // console.log("✅ Member details fetched successfully for:", member.userId);
    
//     res.json({
//       success: true,
//       data: memberDetails
//     });
    
//   } catch (error) {
//     // console.error("❌ Error in getMemberDetails:", error);
//     res.status(500).json({ 
//       success: false, 
//       message: error.message || "Internal server error" 
//     });
//   }
// });
// module.exports = router;


// routes/userAuth.routes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { 
  register, 
  login,
  getReferralStats, 
} = require('../controllers/userAuth.controller');
const userAuth = require("../middlewares/userAuth.middleware");
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const ReferralService = require('../../services/referralService');

// Auth Routes
router.post('/register', register);
router.post('/login', login);
router.get('/referral', userAuth, getReferralStats);

// ========== HELPER FUNCTIONS ==========
const getHorizontalRequirement = (level) => {
  if (level <= 3) return 1;
  if (level <= 6) return 2;
  if (level <= 9) return 3;
  if (level <= 12) return 4;
  if (level <= 15) return 5;
  if (level <= 18) return 6;
  return 7;
};

const getRequiredLevels = (level) => {
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
  return requirements[level] || [];
};

// ========== GET LEG UNLOCKING STATUS WITH HORIZONTAL REQUIREMENTS ==========
router.get('/leg-status', userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const directReferralsCount = user.legs?.length || 0;
    const totalLegs = user.legs?.length || 0;
    const activeLegs = user.legs?.filter(leg => leg.isActive).length || 0;
    
    // Level accessibility check
    const levelAccessibility = {};
    for (let level = 1; level <= 21; level++) {
      const minDirectsNeeded = getHorizontalRequirement(level);
      const requiredLevels = getRequiredLevels(level);
      
      levelAccessibility[`level${level}`] = {
        isAccessible: user.isLevelAccessible ? user.isLevelAccessible(level) : (level <= 3),
        requiredLevels,
        minDirectsNeeded,
        currentDirects: directReferralsCount,
        usersCount: 0,
        meetsHorizontal: directReferralsCount >= minDirectsNeeded,
        unlockedLegs: 0,
        legWiseUsers: {}
      };
      
      // Count users at this level across all legs
      for (let legIndex = 0; legIndex < (user.legs || []).length; legIndex++) {
        const leg = user.legs[legIndex];
        const levelKey = `level${level}`;
        if (leg.levels?.[levelKey]) {
          const userCount = leg.levels[levelKey].users?.length || 0;
          levelAccessibility[`level${level}`].usersCount += userCount;
          levelAccessibility[`level${level}`].legWiseUsers[`leg${legIndex+1}`] = userCount;
          if (leg.levels[levelKey].isUnlocked) {
            levelAccessibility[`level${level}`].unlockedLegs++;
          }
        }
      }
    }
    
    // Leg details
    const legDetails = {};
    for (let i = 0; i < (user.legs || []).length; i++) {
      const leg = user.legs[i];
      
      // Calculate unlocked levels in this leg
      let unlockedCount = 0;
      const levelStatus = {};
      for (let level = 1; level <= 21; level++) {
        const isUnlocked = leg.levels?.[`level${level}`]?.isUnlocked || level <= 3;
        if (isUnlocked) unlockedCount++;
        levelStatus[`level${level}`] = {
          users: leg.levels?.[`level${level}`]?.users?.length || 0,
          isUnlocked,
          unlockedAt: leg.levels?.[`level${level}`]?.unlockedAt,
          earnings: leg.levels?.[`level${level}`]?.earnings || 0
        };
      }
      
      legDetails[`leg${i+1}`] = {
        legNumber: leg.legNumber,
        rootUser: leg.rootUser,
        joinedAt: leg.joinedAt,
        isActive: leg.isActive !== false, // सगळ्या legs active
        totalUsers: leg.stats?.totalUsers || 0,
        totalEarnings: leg.stats?.totalEarnings || 0,
        unlockedLevels: unlockedCount,
        isFullyUnlocked: unlockedCount === 21,
        levels: levelStatus
      };
    }
    
    // Next level to unlock
    let nextLevelToUnlock = null;
    for (let level = 4; level <= 21; level++) {
      if (!levelAccessibility[`level${level}`].isAccessible) {
        const minDirectsNeeded = getHorizontalRequirement(level);
        const requiredLevels = getRequiredLevels(level);
        
        // Check which requirements are missing
        const missingReqs = [];
        
        // Check horizontal requirement
        if (directReferralsCount < minDirectsNeeded) {
          missingReqs.push(`Need ${minDirectsNeeded} direct referrals (have ${directReferralsCount})`);
        }
        
        // Check vertical requirement
        for (const reqLevel of requiredLevels) {
          if (levelAccessibility[`level${reqLevel}`].usersCount === 0) {
            missingReqs.push(`Level ${reqLevel} has no users`);
          }
        }
        
        nextLevelToUnlock = {
          level: level,
          requiredLevels,
          minDirectsNeeded,
          currentDirects: directReferralsCount,
          missingReqs,
          remaining: missingReqs.length
        };
        break;
      }
    }
    
    // Get missed commissions summary
    const missedCommissions = user.getMissedCommissionsSummary ? 
      user.getMissedCommissionsSummary() : { totalMissed: 0, unreadCount: 0, recent: [] };
    
    const legStatus = {
      success: true,
      data: {
        userId: user.userId,
        directReferrals: directReferralsCount,
        totalLegs: totalLegs,
        activeLegs: activeLegs,
        levelAccessibility: levelAccessibility,
        legDetails: legDetails,
        nextLevelToUnlock: nextLevelToUnlock,
        missedCommissions: missedCommissions,
        summary: `You have ${directReferralsCount} direct referral${directReferralsCount !== 1 ? 's' : ''} (${totalLegs} leg${totalLegs !== 1 ? 's' : ''}, ${activeLegs} active). `
      }
    };

    if (nextLevelToUnlock) {
      legStatus.data.summary += `Next: Level ${nextLevelToUnlock.level} - ${nextLevelToUnlock.missingReqs.join(', ')}.`;
    } else {
      legStatus.data.summary += `🎉 All 21 levels are accessible! Great job!`;
    }

    res.json(legStatus);
    
  } catch (error) {
    console.error("Leg status error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== GET NEXT LEVEL REQUIREMENT WITH HORIZONTAL/VERTICAL ==========
router.get('/next-level-requirement', userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const directReferrals = user.legs?.length || 0;
    
    // Find next inaccessible level
    let nextLevel = null;
    for (let level = 4; level <= 21; level++) {
      if (!user.isLevelAccessible || !user.isLevelAccessible(level)) {
        const required = getRequiredLevels(level);
        const minDirectsNeeded = getHorizontalRequirement(level);
        
        // Check progress on required levels
        const progress = {};
        for (const reqLevel of required) {
          let usersCount = 0;
          for (const leg of user.legs || []) {
            usersCount += leg.levels?.[`level${reqLevel}`]?.users?.length || 0;
          }
          progress[`level${reqLevel}`] = {
            required: true,
            usersCount: usersCount,
            isComplete: usersCount > 0
          };
        }
        
        const completedCount = Object.values(progress).filter(p => p.isComplete).length;
        const remainingCount = required.length - completedCount;
        
        // Check horizontal progress
        const horizontalProgress = {
          required: minDirectsNeeded,
          current: directReferrals,
          isComplete: directReferrals >= minDirectsNeeded,
          remaining: Math.max(0, minDirectsNeeded - directReferrals)
        };
        
        nextLevel = {
          level: level,
          requiredLevels: required,
          minDirectsNeeded,
          progress: progress,
          horizontalProgress,
          completedCount: completedCount,
          remainingCount: remainingCount,
          isUnlockable: (completedCount === required.length) && (directReferrals >= minDirectsNeeded)
        };
        break;
      }
    }

    res.json({
      success: true,
      data: {
        userId: user.userId,
        directReferrals: directReferrals,
        totalLegs: user.legs?.length || 0,
        activeLegs: user.legs?.filter(l => l.isActive).length || 0,
        nextLevelToUnlock: nextLevel,
        summary: nextLevel ? 
          (nextLevel.isUnlockable ? 
            `✅ You can unlock Level ${nextLevel.level} now!` : 
            `⏳ Level ${nextLevel.level} needs: ${nextLevel.horizontalProgress.remaining > 0 ? `${nextLevel.horizontalProgress.remaining} more direct referral(s)` : ''} ${nextLevel.remainingCount > 0 ? `and complete levels ${nextLevel.requiredLevels.join(', ')}` : ''}`.trim()) :
          '🎉 All 21 levels unlocked! Great job!'
      }
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== GET MISSED COMMISSIONS ==========
router.get('/missed-commissions', userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // Use ReferralService to get missed commissions
    const missedSummary = await ReferralService.getMissedCommissionsSummary(user._id);
    
    res.json({
      success: true,
      data: missedSummary
    });
    
  } catch (error) {
    console.error("Error getting missed commissions:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== MARK MISSED COMMISSIONS AS READ ==========
router.post('/missed-commissions/read', userAuth, async (req, res) => {
  try {
    const { commissionIds } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    if (!user.missedCommissions) {
      user.missedCommissions = [];
      await user.save();
      return res.json({ success: true, message: "No commissions to mark" });
    }
    
    if (commissionIds && commissionIds.length > 0) {
      // Mark specific commissions as read
      user.missedCommissions.forEach(mc => {
        if (commissionIds.includes(mc._id?.toString())) {
          mc.read = true;
        }
      });
    } else {
      // Mark all as read
      user.missedCommissions.forEach(mc => {
        mc.read = true;
      });
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: "Commissions marked as read"
    });
    
  } catch (error) {
    console.error("Error marking commissions as read:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== GET MEMBER DETAILS WITH NEW SCHEMA ==========
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
    
    // Method 3: Try with regex
    if (!member) {
      member = await User.findOne({ userId: { $regex: new RegExp(`^${memberId}$`, 'i') } });
    }
    
    if (!member) {
      return res.status(404).json({ 
        success: false, 
        message: "Member not found" 
      });
    }
    
    console.log(`✅ Member found: ${member.userId}`);
    
    // ========== DYNAMIC LEGS DATA EXTRACTION ==========
    
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
    
    // Leg status
    const legsStatus = {};
    for (let i = 0; i < (member.legs || []).length; i++) {
      const leg = member.legs[i];
      
      let unlockedCount = 0;
      for (let level = 1; level <= 21; level++) {
        if (leg.levels?.[`level${level}`]?.isUnlocked) unlockedCount++;
      }
      
      legsStatus[`leg${i+1}`] = {
        legNumber: leg.legNumber,
        rootUser: leg.rootUser,
        isActive: leg.isActive !== false,
        totalUsers: leg.stats?.totalUsers || 0,
        totalEarnings: leg.stats?.totalEarnings || 0,
        unlockedLevels: unlockedCount,
        isFullyUnlocked: unlockedCount === 21
      };
    }
    
    // Level accessibility summary
    const levelAccessibility = {};
    for (let level = 1; level <= 21; level++) {
      levelAccessibility[`level${level}`] = member.isLevelAccessible ? 
        member.isLevelAccessible(level) : (level <= 3);
    }
    
    // Get missed commissions
    const missedCommissions = await ReferralService.getMissedCommissionsSummary(member._id);
    
    // Get member details with new schema
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
      missedCommissions: missedCommissions,
      
      // Team Stats
      directReferrals: member.legs?.length || 0,
      totalTeam: totalTeam,
      downlineCount: downlineCount,
      
      // Leg Status
      totalLegs: member.legs?.length || 0,
      activeLegs: member.legs?.filter(l => l.isActive !== false).length || 0,
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
          if (leg.levels?.[`level${level}`]?.users?.includes(member._id)) {
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
    
    console.log("✅ Member details fetched successfully");
    
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

// ========== GET TEAM SUMMARY ==========
router.get('/team-summary', userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const teamSummary = user.getTeamSummary ? user.getTeamSummary() : {
      totalLegs: user.legs?.length || 0,
      directReferrals: user.legs?.length || 0,
      totalTeam: user.teamStats?.totalTeam || 0,
      earningsByLevel: user.earningsByLevel || {},
      totalEarnings: user.totalEarnings || 0,
      levels: {}
    };
    
    // Add missed commissions info
    const missedCommissions = await ReferralService.getMissedCommissionsSummary(user._id);
    
    res.json({
      success: true,
      data: {
        ...teamSummary,
        missedCommissions
      }
    });
    
  } catch (error) {
    console.error("Team summary error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== GET LEG-WISE BREAKDOWN ==========
router.get('/leg-breakdown', userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const legSummary = user.getLegSummary ? user.getLegSummary() : {
      totalLegs: user.legs?.length || 0,
      directReferrals: user.legs?.length || 0,
      legs: (user.legs || []).map(leg => ({
        legNumber: leg.legNumber,
        rootUser: leg.rootUser,
        joinedAt: leg.joinedAt,
        totalUsers: leg.stats?.totalUsers || 0,
        totalEarnings: leg.stats?.totalEarnings || 0,
        totalTeamCashback: leg.stats?.totalTeamCashback || 0,
        levels: leg.levels || {}
      }))
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

// ========== GET USERS AT SPECIFIC LEVEL ==========
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
    
    // Get horizontal requirement for this level
    const minDirectsNeeded = getHorizontalRequirement(levelNum);
    
    res.json({
      success: true,
      data: {
        level: levelNum,
        isAccessible: user.isLevelAccessible ? user.isLevelAccessible(levelNum) : (levelNum <= 3),
        requiredDirects: minDirectsNeeded,
        currentDirects: user.legs?.length || 0,
        totalUsers: userList.length,
        users: userList
      }
    });
    
  } catch (error) {
    console.error("Error getting level users:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== GET FOMO NOTIFICATIONS ==========
router.get('/fomo-notifications', userAuth, async (req, res) => {
  try {
    // Use ReferralService to get FOMO notifications
    const notifications = await ReferralService.getFomoNotifications(req.user.id);
    
    res.json({
      success: true,
      data: notifications
    });
    
  } catch (error) {
    console.error("Error getting FOMO notifications:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== GET LEG-WISE USERS WITH DETAILS ==========
router.get('/leg-users/:legNumber/:level', userAuth, async (req, res) => {
  try {
    const { legNumber, level } = req.params;
    const legNum = parseInt(legNumber);
    const levelNum = parseInt(level);
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
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
        users: usersList
      }
    });
    
  } catch (error) {
    console.error("Error fetching leg users:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});


// ========== GET TODAY'S TEAM STATS ==========
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
    
    // Calculate your commission (simplified - 10% of team business)
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

module.exports = router;