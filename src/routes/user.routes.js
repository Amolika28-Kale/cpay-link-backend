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

// Auth Routes
router.post('/register', register);
router.post('/login', login);
router.get('/referral', userAuth, getReferralStats);

// ========== UPDATED: Get leg unlocking status for Dynamic Legs ==========
router.get('/leg-status', userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // Dynamic legs मध्ये प्रत्येक direct referral साठी एक leg आहे
    const directReferralsCount = user.legs.length;
    const totalLegs = user.legs.length;
    
    // Level requirements मिळवा (कोणत्या levels साठी कोणते levels पाहिजेत)
    const levelRequirements = User.getLevelRequirements();
    
    // Level accessibility check करा
    const levelAccessibility = {};
    for (let level = 1; level <= 21; level++) {
      levelAccessibility[`level${level}`] = {
        isAccessible: user.isLevelAccessible(level),
        requiredLevels: levelRequirements[level]?.required || [],
        usersCount: 0
      };
      
      // Count users at this level across all legs
      for (const leg of user.legs) {
        const levelKey = `level${level}`;
        if (leg.levels[levelKey]) {
          levelAccessibility[`level${level}`].usersCount += leg.levels[levelKey].users.length;
        }
      }
    }
    
    // Leg details तयार करा
    const legDetails = {};
    for (let i = 0; i < user.legs.length; i++) {
      const leg = user.legs[i];
      legDetails[`leg${i+1}`] = {
        legNumber: leg.legNumber,
        rootUser: leg.rootUser,
        joinedAt: leg.joinedAt,
        totalUsers: leg.stats.totalUsers,
        totalEarnings: leg.stats.totalEarnings,
        levels: {}
      };
      
      // Leg मधील प्रत्येक level ची माहिती
      for (let level = 1; level <= 21; level++) {
        const levelKey = `level${level}`;
        legDetails[`leg${i+1}`].levels[`level${level}`] = {
          users: leg.levels[levelKey].users.length,
          isUnlocked: leg.levels[levelKey].isUnlocked,
          unlockedAt: leg.levels[levelKey].unlockedAt
        };
      }
    }
    
    // Next level to unlock शोधा
    let nextLevelToUnlock = null;
    for (let level = 4; level <= 21; level++) {
      if (!levelAccessibility[`level${level}`].isAccessible) {
        nextLevelToUnlock = {
          level: level,
          requiredLevels: levelRequirements[level]?.required || [],
          remaining: 0 // Calculate based on missing users in required levels
        };
        
        // Check which required levels are missing users
        const missingLevels = [];
        for (const reqLevel of nextLevelToUnlock.requiredLevels) {
          if (levelAccessibility[`level${reqLevel}`].usersCount === 0) {
            missingLevels.push(reqLevel);
          }
        }
        nextLevelToUnlock.missingLevels = missingLevels;
        nextLevelToUnlock.remaining = missingLevels.length;
        break;
      }
    }
    
    const legStatus = {
      success: true,
      data: {
        userId: user.userId,
        directReferrals: directReferralsCount,
        totalLegs: totalLegs,
        levelAccessibility: levelAccessibility,
        legDetails: legDetails,
        nextLevelToUnlock: nextLevelToUnlock,
        summary: `You have ${directReferralsCount} direct referral${directReferralsCount !== 1 ? 's' : ''}, which means ${totalLegs} leg${totalLegs !== 1 ? 's' : ''}. `
      }
    };

    if (nextLevelToUnlock) {
      legStatus.data.summary += `Need to complete levels ${nextLevelToUnlock.requiredLevels.join(', ')} to unlock Level ${nextLevelToUnlock.level}.`;
    } else {
      legStatus.data.summary += `🎉 All 21 levels are accessible! Great job!`;
    }

    res.json(legStatus);
    
  } catch (error) {
    console.error("Leg status error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== UPDATED: Get next level requirement for Dynamic Legs ==========
router.get('/next-level-requirement', userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const directReferrals = user.legs.length;
    const levelRequirements = User.getLevelRequirements();
    
    // Find next inaccessible level
    let nextLevel = null;
    for (let level = 4; level <= 21; level++) {
      if (!user.isLevelAccessible(level)) {
        const required = levelRequirements[level]?.required || [];
        
        // Check progress on required levels
        const progress = {};
        for (const reqLevel of required) {
          let usersCount = 0;
          for (const leg of user.legs) {
            usersCount += leg.levels[`level${reqLevel}`]?.users.length || 0;
          }
          progress[`level${reqLevel}`] = {
            required: true,
            usersCount: usersCount,
            isComplete: usersCount > 0
          };
        }
        
        const completedCount = Object.values(progress).filter(p => p.isComplete).length;
        const remainingCount = required.length - completedCount;
        
        nextLevel = {
          level: level,
          requiredLevels: required,
          progress: progress,
          completedCount: completedCount,
          remainingCount: remainingCount,
          isUnlockable: completedCount === required.length
        };
        break;
      }
    }

    res.json({
      success: true,
      data: {
        userId: user.userId,
        directReferrals: directReferrals,
        totalLegs: user.legs.length,
        nextLevelToUnlock: nextLevel,
        summary: nextLevel ? 
          (nextLevel.isUnlockable ? 
            `✅ You can unlock Level ${nextLevel.level} now!` : 
            `⏳ Need to complete levels ${nextLevel.requiredLevels.join(', ')} to unlock Level ${nextLevel.level}. Progress: ${nextLevel.completedCount}/${nextLevel.requiredLevels.length}`) :
          '🎉 All 21 levels unlocked! Great job!'
      }
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== UPDATED: Get member details for Dynamic Legs ==========
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
        teamCashbackTotal += leg.levels[`level${level}`]?.teamCashback || 0;
      }
    }
    
    // Calculate total team members
    let totalTeam = 0;
    const downlineCount = {};
    const levelWiseUsers = {};
    
    for (let level = 1; level <= 21; level++) {
      let usersAtLevel = 0;
      for (const leg of member.legs || []) {
        usersAtLevel += leg.levels[`level${level}`]?.users.length || 0;
      }
      downlineCount[`level${level}`] = usersAtLevel;
      totalTeam += usersAtLevel;
      
      // Store user IDs for this level (for potential expansion)
      if (usersAtLevel > 0) {
        levelWiseUsers[`level${level}`] = [];
        for (const leg of member.legs || []) {
          levelWiseUsers[`level${level}`].push(...leg.levels[`level${level}`]?.users || []);
        }
      }
    }
    
    // Get level-wise earnings
    const levelEarnings = {};
    for (let level = 1; level <= 21; level++) {
      levelEarnings[`level${level}`] = member.earningsByLevel?.[`level${level}`] || 0;
    }
    
    // Leg unlocking status (प्रत्येक leg साठी)
    const legsStatus = {};
    for (let i = 0; i < (member.legs || []).length; i++) {
      const leg = member.legs[i];
      legsStatus[`leg${i+1}`] = {
        legNumber: leg.legNumber,
        rootUser: leg.rootUser,
        totalUsers: leg.stats.totalUsers,
        totalEarnings: leg.stats.totalEarnings,
        levelsUnlocked: Object.values(leg.levels).filter(l => l.isUnlocked).length
      };
    }
    
    // Level accessibility summary
    const levelAccessibility = {};
    for (let level = 1; level <= 21; level++) {
      levelAccessibility[`level${level}`] = member.isLevelAccessible(level);
    }
    
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
      
      // Team Stats
      directReferrals: member.legs?.length || 0,
      totalTeam: totalTeam,
      downlineCount: downlineCount,
      
      // Leg Status
      totalLegs: member.legs?.length || 0,
      legsStatus: legsStatus,
      levelAccessibility: levelAccessibility,
      
      // Relationship with current user
      relationship: {
        isCurrentUser: member._id.toString() === currentUserId,
        isInDownline: false, // Will check below
        downlineLevel: null
      },
      
      recentActivity: []
    };
    
    // Check if this member is in current user's downline
    const currentUser = await User.findById(currentUserId);
    if (currentUser && member._id.toString() !== currentUserId) {
      for (let level = 1; level <= 21; level++) {
        for (const leg of currentUser.legs || []) {
          if (leg.levels[`level${level}`]?.users.includes(member._id)) {
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

// ========== NEW: Get team summary with dynamic legs ==========
router.get('/team-summary', userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const teamSummary = user.getTeamSummary();
    
    res.json({
      success: true,
      data: teamSummary
    });
    
  } catch (error) {
    console.error("Team summary error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== NEW: Get leg-wise breakdown ==========
router.get('/leg-breakdown', userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const legSummary = user.getLegSummary();
    
    res.json({
      success: true,
      data: legSummary
    });
    
  } catch (error) {
    console.error("Leg breakdown error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== NEW: Get users at specific level ==========
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
    
    for (let i = 0; i < user.legs.length; i++) {
      const leg = user.legs[i];
      const usersAtLevel = leg.levels[levelKey]?.users || [];
      
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
        isAccessible: user.isLevelAccessible(levelNum),
        totalUsers: userList.length,
        users: userList
      }
    });
    
  } catch (error) {
    console.error("Error getting level users:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;