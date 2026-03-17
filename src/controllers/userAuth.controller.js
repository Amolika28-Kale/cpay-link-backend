// const User = require("../models/User");
// const Wallet = require("../models/Wallet");
// const Transaction = require("../models/Transaction"); // ✅ Transaction model import करा
// const jwt = require("jsonwebtoken");
// const { default: mongoose } = require("mongoose");
// const bcryptjs = require("bcryptjs");

// exports.register = async (req, res) => {
//   const session = await mongoose.startSession(); // ✅ Transaction साठी session
//   session.startTransaction();

//   try {
//     let { userId, pin, email, referralCode } = req.body;

//     // ✅ 1. Check all required fields including referralCode
//     if (!userId || !pin || !email || !referralCode) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ 
//         success: false,
//         message: "User ID, PIN, Email and Referral Code are required" 
//       });
//     }

//     // ✅ 2. User ID validation (6 digits)
//     if (!/^\d{6}$/.test(userId)) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ 
//         success: false,
//         message: "User ID must be 6 digits" 
//       });
//     }

//     // ✅ 3. Email validation
//     const emailRegex = /^\S+@\S+\.\S+$/;
//     if (!emailRegex.test(email)) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ 
//         success: false,
//         message: "Please enter a valid email" 
//       });
//     }

//     // ✅ 4. PIN validation (6 digits)
//     if (!/^\d{6}$/.test(pin)) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ 
//         success: false,
//         message: "PIN must be 6 digits" 
//       });
//     }

//     userId = userId.trim();
//     email = email.toLowerCase().trim();
    
//     // ✅ 5. Validate referral code
//     const referrer = await User.findOne({ referralCode: referralCode.trim().toUpperCase() }).session(session);
    
//     if (!referrer) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ 
//         success: false,
//         message: "Invalid referral code. Please check and try again." 
//       });
//     }

//     // ✅ 6. Check if user exists
//     const exists = await User.findOne({ 
//       $or: [{ userId }, { email }] 
//     }).session(session);
    
//     if (exists) {
//       await session.abortTransaction();
//       session.endSession();
//       if (exists.userId === userId) {
//         return res.status(400).json({ 
//           success: false,
//           message: "User ID already taken" 
//         });
//       }
//       if (exists.email === email) {
//         return res.status(400).json({ 
//           success: false,
//           message: "Email already registered" 
//         });
//       }
//     }

//     // ✅ 7. Create user
//     const user = new User({
//       userId,
//       email,
//       pin,
//       referredBy: referrer._id,
//       autoRequest: {
//         firstRequestCreated: false,
//         secondRequestCreated: false,
//         autoRequestCompleted: false,
//         firstRequestAmount: 1000,
//         secondRequestAmount: 1000
//       }
//     });

//     await user.save({ session });

//     // ✅ 8. Create default wallets with BONUS
//     const BONUS_USDT = 1; // $1 USDT बोनस
//     const CONVERSION_RATE = 95; // 1 USDT = ₹95
    
//     // USDT Wallet with $1 bonus
//     const usdtWallet = new Wallet({
//       user: user._id,
//       type: "USDT",
//       balance: BONUS_USDT // ✅ $1 बोनस
//     });
//     await usdtWallet.save({ session });

//     // INR Wallet with ₹95 (from conversion)
//     const inrWallet = new Wallet({
//       user: user._id,
//       type: "INR",
//       balance: BONUS_USDT * CONVERSION_RATE // ✅ ₹95 बोनस
//     });
//     await inrWallet.save({ session });

//     // Cashback Wallet with ₹0
//     const cashbackWallet = new Wallet({
//       user: user._id,
//       type: "CASHBACK",
//       balance: 0
//     });
//     await cashbackWallet.save({ session });

//     // ✅ 9. Create TRANSACTION records for the bonus
//     const transactions = [
//       {
//         user: user._id,
//         type: "DEPOSIT",
//         fromWallet: null,
//         toWallet: "USDT",
//         amount: BONUS_USDT,
//         meta: {
//           currency: "USDT",
//           symbol: "$",
//           type: "WELCOME_BONUS",
//           description: "Welcome bonus for new user"
//         }
//       },
//       {
//         user: user._id,
//         type: "CONVERSION",
//         fromWallet: "USDT",
//         toWallet: "INR",
//         amount: BONUS_USDT * CONVERSION_RATE,
//         meta: {
//           rate: CONVERSION_RATE,
//           originalAmount: BONUS_USDT,
//           originalCurrency: "USDT",
//           symbol: "₹",
//           type: "BONUS_CONVERSION",
//           description: "Welcome bonus converted to INR"
//         }
//       },
//       {
//         user: user._id,
//         type: "CREDIT",
//         fromWallet: "SYSTEM",
//         toWallet: "INR",
//         amount: BONUS_USDT * CONVERSION_RATE,
//         meta: {
//           type: "WELCOME_BONUS",
//           description: "₹95 welcome bonus credited"
//         }
//       }
//     ];

//     await Transaction.insertMany(transactions, { session });

// // ✅ 10. Add to referral tree - session सह
// // await User.addToReferralTree(user._id, referrer._id, 1, session); // <-- session parameter add केला

// // ✅ 10. Add to referral tree - नवीन method call
// await User.addToReferralTree(user._id, referrer._id, session);
//     // ✅ 11. Create FIRST AUTO REQUEST for new user
//     const AutoRequestService = require("../../services/autoRequestService");
//     let autoRequest = null;
//     try {
//       autoRequest = await AutoRequestService.createFirstAutoRequestForUser(user._id, 1000, session);
//       // console.log(`✅ First auto request created for new user: ${user.userId}`);
//     } catch (autoRequestError) {
//       // console.error("❌ Failed to create auto request for new user:", autoRequestError);
//     }

//     // ✅ 12. Commit transaction
//     await session.commitTransaction();
//     session.endSession();

//     // ✅ 13. Generate token
//     const token = jwt.sign(
//       { id: user._id, userId: user.userId, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     // ✅ 14. Return user data with bonus info
//     const safeUser = {
//       _id: user._id,
//       userId: user.userId,
//       email: user.email,
//       referralCode: user.referralCode,
//       role: user.role,
//       wallets: {
//         USDT: BONUS_USDT,
//         INR: BONUS_USDT * CONVERSION_RATE,
//         CASHBACK: 0
//       }
//     };

//     res.status(201).json({ 
//       success: true,
//       token, 
//       user: safeUser,
//       bonus: {
//         usdt: BONUS_USDT,
//         inr: BONUS_USDT * CONVERSION_RATE,
//         message: `Welcome! You received $${BONUS_USDT} USDT (₹${BONUS_USDT * CONVERSION_RATE}) as signup bonus!`
//       },
//       autoRequest: autoRequest ? {
//         id: autoRequest._id,
//         amount: autoRequest.amount,
//         expiresAt: autoRequest.expiresAt,
//         type: "FIRST_WELCOME_BONUS"
//       } : null
//     });

//   } catch (err) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("Register Error:", err);
//     res.status(500).json({ 
//       success: false,
//       message: err.message 
//     });
//   }
// };


// exports.login = async (req, res) => {
//   try {
//     let { userId, pin } = req.body;

//     if (!userId || !pin) {
//       return res.status(400).json({ 
//         success: false,
//         message: "User ID and PIN are required" 
//       });
//     }

//     userId = userId.toString().trim().toUpperCase();
    
//     if (!/^\d{6}$/.test(userId)) {
//       return res.status(400).json({ 
//         success: false,
//         message: "User ID must be 6 digits" 
//       });
//     }

//     const user = await User.findOne({ userId });
    
//     if (!user) {
//       return res.status(404).json({ 
//         success: false,
//         message: "User ID not found" 
//       });
//     }

//     const match = await bcryptjs.compare(pin, user.pin);
    
//     if (!match) {
//       return res.status(400).json({ 
//         success: false,
//         message: "Invalid PIN" 
//       });
//     }

//     // ✅ Check if user has active auto request
//     let activeAutoRequest = null;
//     if (user.autoRequest?.enabled && user.autoRequest?.currentRequestId) {
//       const Scanner = require("../models/Scanner");
//       activeAutoRequest = await Scanner.findOne({
//         _id: user.autoRequest.currentRequestId,
//         status: "ACTIVE"
//       });
//     }

//     const token = jwt.sign(
//       { id: user._id, role: user.role, userId: user.userId },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     const safeUser = {
//       _id: user._id,
//       userId: user.userId,
//       email: user.email,                 // ✅ email return करतोय
//       referralCode: user.referralCode,
//       role: user.role,
//       autoRequest: {
//         enabled: user.autoRequest?.enabled || false,
//         amount: user.autoRequest?.autoRequestAmount || 1000,
//         hasActiveRequest: !!activeAutoRequest
//       }
//     };

//     res.json({
//       success: true,
//       token,
//       user: safeUser
//     });

//   } catch (err) {
//     console.error("Login Error:", err);
//     res.status(500).json({ 
//       success: false,
//       message: err.message || "Server error" 
//     });
//   }
// };
// /* ================= GET REFERRAL STATS ================= */
// exports.getReferralStats = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id); 
//     if (!user) return res.status(404).json({ message: "User not found" });

//     const cashbackWallet = await Wallet.findOne({ user: user._id, type: "CASHBACK" });

//     // ✅ Get all downline counts for 21 levels
//     const referralTree = {
//       level1: user.referralTree?.level1?.length || 0,
//       level2: user.referralTree?.level2?.length || 0,
//       level3: user.referralTree?.level3?.length || 0,
//       level4: user.referralTree?.level4?.length || 0,
//       level5: user.referralTree?.level5?.length || 0,
//       level6: user.referralTree?.level6?.length || 0,
//       level7: user.referralTree?.level7?.length || 0,
//       level8: user.referralTree?.level8?.length || 0,
//       level9: user.referralTree?.level9?.length || 0,
//       level10: user.referralTree?.level10?.length || 0,
//       level11: user.referralTree?.level11?.length || 0,
//       level12: user.referralTree?.level12?.length || 0,
//       level13: user.referralTree?.level13?.length || 0,
//       level14: user.referralTree?.level14?.length || 0,
//       level15: user.referralTree?.level15?.length || 0,
//       level16: user.referralTree?.level16?.length || 0,
//       level17: user.referralTree?.level17?.length || 0,
//       level18: user.referralTree?.level18?.length || 0,
//       level19: user.referralTree?.level19?.length || 0,
//       level20: user.referralTree?.level20?.length || 0,
//       level21: user.referralTree?.level21?.length || 0
//     };

//     // ✅ Earnings by level for 21 levels
//     const earningsByLevel = {
//       level1: user.referralEarnings?.level1 || 0,
//       level2: user.referralEarnings?.level2 || 0,
//       level3: user.referralEarnings?.level3 || 0,
//       level4: user.referralEarnings?.level4 || 0,
//       level5: user.referralEarnings?.level5 || 0,
//       level6: user.referralEarnings?.level6 || 0,
//       level7: user.referralEarnings?.level7 || 0,
//       level8: user.referralEarnings?.level8 || 0,
//       level9: user.referralEarnings?.level9 || 0,
//       level10: user.referralEarnings?.level10 || 0,
//       level11: user.referralEarnings?.level11 || 0,
//       level12: user.referralEarnings?.level12 || 0,
//       level13: user.referralEarnings?.level13 || 0,
//       level14: user.referralEarnings?.level14 || 0,
//       level15: user.referralEarnings?.level15 || 0,
//       level16: user.referralEarnings?.level16 || 0,
//       level17: user.referralEarnings?.level17 || 0,
//       level18: user.referralEarnings?.level18 || 0,
//       level19: user.referralEarnings?.level19 || 0,
//       level20: user.referralEarnings?.level20 || 0,
//       level21: user.referralEarnings?.level21 || 0,
//       total: user.referralEarnings?.total || 0
//     };

//     res.json({
//       referralCode: user.referralCode,
//       totalReferrals: Object.values(referralTree).reduce((a, b) => a + b, 0),
//       referralEarnings: user.referralEarnings || { total: 0 },
//       cashbackBalance: cashbackWallet?.balance || 0,
//       referralTree,
//       earningsByLevel
//     });

//   } catch (err) {
//     // console.error("Referral Stats Error:", err);
//     res.status(500).json({ message: err.message });
//   }
// };



const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const jwt = require("jsonwebtoken");
const { default: mongoose } = require("mongoose");
const bcryptjs = require("bcryptjs");
const ReferralService = require("../../services/referralService");

exports.register = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let { userId, pin, email, referralCode } = req.body;

    // ✅ 1. Check all required fields including referralCode
    if (!userId || !pin || !email || !referralCode) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false,
        message: "User ID, PIN, Email and Referral Code are required" 
      });
    }

    // ✅ 2. User ID validation (6 digits)
    if (!/^\d{6}$/.test(userId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false,
        message: "User ID must be 6 digits" 
      });
    }

    // ✅ 3. Email validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false,
        message: "Please enter a valid email" 
      });
    }

    // ✅ 4. PIN validation (6 digits)
    if (!/^\d{6}$/.test(pin)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false,
        message: "PIN must be 6 digits" 
      });
    }

    userId = userId.trim();
    email = email.toLowerCase().trim();
    
    // ✅ 5. Validate referral code
    const referrer = await User.findOne({ referralCode: referralCode.trim().toUpperCase() }).session(session);
    
    if (!referrer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false,
        message: "Invalid referral code. Please check and try again." 
      });
    }

    // ✅ 6. Check if user exists
    const exists = await User.findOne({ 
      $or: [{ userId }, { email }] 
    }).session(session);
    
    if (exists) {
      await session.abortTransaction();
      session.endSession();
      if (exists.userId === userId) {
        return res.status(400).json({ 
          success: false,
          message: "User ID already taken" 
        });
      }
      if (exists.email === email) {
        return res.status(400).json({ 
          success: false,
          message: "Email already registered" 
        });
      }
    }

    // ✅ 7. Create user
    const user = new User({
      userId,
      email,
      pin,
      referredBy: referrer._id,
      legs: [], // Empty legs array - will be filled when adding to tree
      directReferralsCount: 0,
      autoRequest: {
        firstRequestCreated: false,
        secondRequestCreated: false,
        autoRequestCompleted: false,
        firstRequestAmount: 1000,
        secondRequestAmount: 1000
      }
    });

    await user.save({ session });

    // ✅ 8. Create default wallets with BONUS
    const BONUS_USDT = 1; // $1 USDT बोनस
    const CONVERSION_RATE = 95; // 1 USDT = ₹95
    
    // USDT Wallet with $1 bonus
    const usdtWallet = new Wallet({
      user: user._id,
      type: "USDT",
      balance: BONUS_USDT
    });
    await usdtWallet.save({ session });

    // INR Wallet with ₹95 (from conversion)
    const inrWallet = new Wallet({
      user: user._id,
      type: "INR",
      balance: BONUS_USDT * CONVERSION_RATE
    });
    await inrWallet.save({ session });

    // Cashback Wallet with ₹0
    const cashbackWallet = new Wallet({
      user: user._id,
      type: "CASHBACK",
      balance: 0
    });
    await cashbackWallet.save({ session });

    // ✅ 9. Create TRANSACTION records for the bonus
    const transactions = [
      {
        user: user._id,
        type: "DEPOSIT",
        fromWallet: null,
        toWallet: "USDT",
        amount: BONUS_USDT,
        meta: {
          currency: "USDT",
          symbol: "$",
          type: "WELCOME_BONUS",
          description: "Welcome bonus for new user"
        }
      },
      {
        user: user._id,
        type: "CONVERSION",
        fromWallet: "USDT",
        toWallet: "INR",
        amount: BONUS_USDT * CONVERSION_RATE,
        meta: {
          rate: CONVERSION_RATE,
          originalAmount: BONUS_USDT,
          originalCurrency: "USDT",
          symbol: "₹",
          type: "BONUS_CONVERSION",
          description: "Welcome bonus converted to INR"
        }
      },
      {
        user: user._id,
        type: "CREDIT",
        fromWallet: "SYSTEM",
        toWallet: "INR",
        amount: BONUS_USDT * CONVERSION_RATE,
        meta: {
          type: "WELCOME_BONUS",
          description: "₹95 welcome bonus credited"
        }
      }
    ];

    await Transaction.insertMany(transactions, { session });

    // ✅ 10. Add to referral tree - नवीन method call
    // First create a leg for the direct referral
    await referrer.createNewLeg(user._id);
    
    // Then add to referral tree (for upline commissions)
    await User.addToReferralTree(user._id, referrer._id, session);
    
    // Check for any level unlocks
    await referrer.checkAllLegsForUnlocks();

    // ✅ 11. Create FIRST AUTO REQUEST for new user
    const AutoRequestService = require("../../services/autoRequestService");
    let autoRequest = null;
    try {
      autoRequest = await AutoRequestService.createFirstAutoRequestForUser(user._id, 1000, session);
    } catch (autoRequestError) {
      console.error("❌ Failed to create auto request for new user:", autoRequestError);
    }

    // ✅ 12. Commit transaction
    await session.commitTransaction();
    session.endSession();

    // ✅ 13. Generate token
    const token = jwt.sign(
      { id: user._id, userId: user.userId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ 14. Return user data with bonus info
    const safeUser = {
      _id: user._id,
      userId: user.userId,
      email: user.email,
      referralCode: user.referralCode,
      role: user.role,
      wallets: {
        USDT: BONUS_USDT,
        INR: BONUS_USDT * CONVERSION_RATE,
        CASHBACK: 0
      }
    };

    res.status(201).json({ 
      success: true,
      token, 
      user: safeUser,
      bonus: {
        usdt: BONUS_USDT,
        inr: BONUS_USDT * CONVERSION_RATE,
        message: `Welcome! You received $${BONUS_USDT} USDT (₹${BONUS_USDT * CONVERSION_RATE}) as signup bonus!`
      },
      autoRequest: autoRequest ? {
        id: autoRequest._id,
        amount: autoRequest.amount,
        expiresAt: autoRequest.expiresAt,
        type: "FIRST_WELCOME_BONUS"
      } : null
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Register Error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

exports.login = async (req, res) => {
  try {
    let { userId, pin } = req.body;

    if (!userId || !pin) {
      return res.status(400).json({ 
        success: false,
        message: "User ID and PIN are required" 
      });
    }

    userId = userId.toString().trim();
    
    if (!/^\d{6}$/.test(userId)) {
      return res.status(400).json({ 
        success: false,
        message: "User ID must be 6 digits" 
      });
    }

    const user = await User.findOne({ userId });
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User ID not found" 
      });
    }

    const match = await bcryptjs.compare(pin, user.pin);
    
    if (!match) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid PIN" 
      });
    }

    // ✅ Check if user has active auto request
    let activeAutoRequest = null;
    if (user.autoRequest?.currentRequestId) {
      const Scanner = require("../models/Scanner");
      activeAutoRequest = await Scanner.findOne({
        _id: user.autoRequest.currentRequestId,
        status: "ACTIVE"
      });
    }

    // ✅ Get unread notifications count
    const unreadNotifications = user.notifications?.filter(n => !n.read).length || 0;
    
    // ✅ Get missed commissions count
    const missedCommissions = user.missedCommissions?.filter(mc => !mc.read).length || 0;

    const token = jwt.sign(
      { id: user._id, role: user.role, userId: user.userId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const safeUser = {
      _id: user._id,
      userId: user.userId,
      email: user.email,
      referralCode: user.referralCode,
      role: user.role,
      totalLegs: user.legs?.length || 0,
      directReferrals: user.directReferralsCount || 0,
      totalEarnings: user.totalEarnings || 0,
      unreadNotifications,
      missedCommissions,
      autoRequest: {
        enabled: user.autoRequest?.enabled || false,
        amount: user.autoRequest?.autoRequestAmount || 1000,
        hasActiveRequest: !!activeAutoRequest
      }
    };

    res.json({
      success: true,
      token,
      user: safeUser
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message || "Server error" 
    });
  }
};

/* ================= GET REFERRAL STATS ================= */
exports.getReferralStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    const cashbackWallet = await Wallet.findOne({ user: user._id, type: "CASHBACK" });

    // ✅ Get leg summary
    const legSummary = user.getLegSummary ? user.getLegSummary() : { legs: [] };
    
    // ✅ Get missed commissions summary
    const missedSummary = await ReferralService.getMissedCommissionsSummary(user._id);
    
    // ✅ Get FOMO notifications
    const fomoNotifications = await ReferralService.getFomoNotifications(user._id);

    // ✅ Calculate totals from legs
    let totalDownline = 0;
    const levelWiseUsers = {};
    const levelWiseEarnings = { ...user.earningsByLevel };
    const levelWiseUnlocked = {};
    const levelWisePending = {};

    // Initialize level objects
    for (let level = 1; level <= 21; level++) {
      levelWiseUsers[`level${level}`] = 0;
      levelWiseUnlocked[`level${level}`] = 0;
      levelWisePending[`level${level}`] = 0;
    }

    // Aggregate data from all legs
    for (const leg of user.legs || []) {
      for (let level = 1; level <= 21; level++) {
        const levelKey = `level${level}`;
        const levelData = leg.levels?.[levelKey];
        
        if (levelData) {
          levelWiseUsers[levelKey] += levelData.users.length;
          totalDownline += levelData.users.length;
          
          if (levelData.isUnlocked) {
            levelWiseUnlocked[levelKey]++;
          }
          if (levelData.pendingUnlock) {
            levelWisePending[levelKey]++;
          }
        }
      }
    }

    // ✅ Calculate next unlock requirements
    const nextUnlocks = [];
    for (let i = 0; i < (user.legs || []).length; i++) {
      const leg = user.legs[i];
      
      // Find pending unlocks in this leg
      for (const pending of leg.pendingUnlocks || []) {
        const levelsToUnlock = [pending.level, pending.level + 1, pending.level + 2]
          .filter(l => l <= 21);
        
        nextUnlocks.push({
          legNumber: leg.legNumber,
          level: pending.level,
          levelsToUnlock,
          requiredAction: pending.requiredAction || "Add 1 direct referral",
          createdAt: pending.createdAt
        });
      }
    }

    res.json({
      success: true,
      referralCode: user.referralCode,
      totalLegs: user.legs?.length || 0,
      directReferrals: user.directReferralsCount || 0,
      totalDownline,
      totalEarnings: user.totalEarnings || 0,
      cashbackBalance: cashbackWallet?.balance || 0,
      
      // Level wise data
      levelWiseUsers,
      levelWiseEarnings,
      levelWiseUnlocked,
      levelWisePending,
      
      // Leg wise breakdown
      legWiseBreakdown: legSummary.legs.map(leg => ({
        legNumber: leg.legNumber,
        totalUsers: leg.totalUsers,
        totalEarnings: leg.totalEarnings,
        unlockedLevels: leg.unlockedLevels,
        pendingLevels: leg.pendingLevels,
        isFullyUnlocked: leg.isFullyUnlocked,
        levels: leg.levels
      })),
      
      // Next unlocks
      nextUnlocks,
      
      // Missed commissions
      missedCommissions: missedSummary || { totalMissed: 0, unreadCount: 0 },
      
      // FOMO notifications
      fomoNotifications: fomoNotifications.notifications,
      
      // Summary by level ranges (for easier viewing)
      levelRanges: {
        level1_3: {
          users: levelWiseUsers.level1 + levelWiseUsers.level2 + levelWiseUsers.level3,
          earnings: (levelWiseEarnings.level1 || 0) + (levelWiseEarnings.level2 || 0) + (levelWiseEarnings.level3 || 0),
          unlockedIn: levelWiseUnlocked.level1 + levelWiseUnlocked.level2 + levelWiseUnlocked.level3
        },
        level4_6: {
          users: levelWiseUsers.level4 + levelWiseUsers.level5 + levelWiseUsers.level6,
          earnings: (levelWiseEarnings.level4 || 0) + (levelWiseEarnings.level5 || 0) + (levelWiseEarnings.level6 || 0),
          unlockedIn: levelWiseUnlocked.level4 + levelWiseUnlocked.level5 + levelWiseUnlocked.level6,
          pendingIn: levelWisePending.level4 + levelWisePending.level5 + levelWisePending.level6
        },
        level7_9: {
          users: levelWiseUsers.level7 + levelWiseUsers.level8 + levelWiseUsers.level9,
          earnings: (levelWiseEarnings.level7 || 0) + (levelWiseEarnings.level8 || 0) + (levelWiseEarnings.level9 || 0),
          unlockedIn: levelWiseUnlocked.level7 + levelWiseUnlocked.level8 + levelWiseUnlocked.level9,
          pendingIn: levelWisePending.level7 + levelWisePending.level8 + levelWisePending.level9
        },
        level10_12: {
          users: levelWiseUsers.level10 + levelWiseUsers.level11 + levelWiseUsers.level12,
          earnings: (levelWiseEarnings.level10 || 0) + (levelWiseEarnings.level11 || 0) + (levelWiseEarnings.level12 || 0),
          unlockedIn: levelWiseUnlocked.level10 + levelWiseUnlocked.level11 + levelWiseUnlocked.level12,
          pendingIn: levelWisePending.level10 + levelWisePending.level11 + levelWisePending.level12
        },
        level13_15: {
          users: levelWiseUsers.level13 + levelWiseUsers.level14 + levelWiseUsers.level15,
          earnings: (levelWiseEarnings.level13 || 0) + (levelWiseEarnings.level14 || 0) + (levelWiseEarnings.level15 || 0),
          unlockedIn: levelWiseUnlocked.level13 + levelWiseUnlocked.level14 + levelWiseUnlocked.level15,
          pendingIn: levelWisePending.level13 + levelWisePending.level14 + levelWisePending.level15
        },
        level16_18: {
          users: levelWiseUsers.level16 + levelWiseUsers.level17 + levelWiseUsers.level18,
          earnings: (levelWiseEarnings.level16 || 0) + (levelWiseEarnings.level17 || 0) + (levelWiseEarnings.level18 || 0),
          unlockedIn: levelWiseUnlocked.level16 + levelWiseUnlocked.level17 + levelWiseUnlocked.level18,
          pendingIn: levelWisePending.level16 + levelWisePending.level17 + levelWisePending.level18
        },
        level19_21: {
          users: levelWiseUsers.level19 + levelWiseUsers.level20 + levelWiseUsers.level21,
          earnings: (levelWiseEarnings.level19 || 0) + (levelWiseEarnings.level20 || 0) + (levelWiseEarnings.level21 || 0),
          unlockedIn: levelWiseUnlocked.level19 + levelWiseUnlocked.level20 + levelWiseUnlocked.level21,
          pendingIn: levelWisePending.level19 + levelWisePending.level20 + levelWisePending.level21
        }
      }
    });

  } catch (err) {
    console.error("Referral Stats Error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* ================= GET LEG DETAILS ================= */
exports.getLegDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    const legNumber = parseInt(req.params.legNumber);
    
    if (isNaN(legNumber) || legNumber < 1 || legNumber > user.legs.length) {
      return res.status(400).json({ 
        success: false,
        message: `Invalid leg number. You have ${user.legs.length} legs.` 
      });
    }

    const leg = user.legs[legNumber - 1];
    
    // Get detailed level information
    const levelDetails = {};
    for (let level = 1; level <= 21; level++) {
      const levelKey = `level${level}`;
      const levelData = leg.levels[levelKey];
      
      // Get user details for this level
      let usersAtLevel = [];
      if (levelData.users.length > 0) {
        const userDetails = await User.find(
          { _id: { $in: levelData.users } },
          'userId email firstDepositCompleted totalEarnings'
        );
        
        usersAtLevel = userDetails.map(u => ({
          userId: u.userId,
          email: u.email,
          isActive: u.firstDepositCompleted,
          earnings: u.totalEarnings || 0
        }));
      }
      
      levelDetails[levelKey] = {
        users: usersAtLevel,
        userCount: levelData.users.length,
        earnings: levelData.earnings || 0,
        teamCashback: levelData.teamCashback || 0,
        isUnlocked: levelData.isUnlocked || false,
        pendingUnlock: levelData.pendingUnlock || false,
        unlockedAt: levelData.unlockedAt,
        commissionRate: user.commissionRates?.[levelKey] || 0
      };
    }

    // Check if this leg has any pending unlocks
    const pendingInThisLeg = leg.pendingUnlocks || [];

    res.json({
      success: true,
      legNumber: leg.legNumber,
      rootUser: leg.rootUser,
      joinedAt: leg.joinedAt,
      isActive: leg.isActive,
      stats: {
        totalUsers: leg.stats.totalUsers,
        totalEarnings: leg.stats.totalEarnings,
        totalTeamCashback: leg.stats.totalTeamCashback,
        lastActivity: leg.stats.lastActivity
      },
      pendingUnlocks: pendingInThisLeg,
      levelDetails,
      summary: {
        unlockedLevels: Object.values(levelDetails).filter(l => l.isUnlocked).length,
        pendingLevels: Object.values(levelDetails).filter(l => l.pendingUnlock).length,
        totalUsersInLeg: leg.stats.totalUsers,
        totalEarningsFromLeg: leg.stats.totalEarnings
      }
    });

  } catch (err) {
    console.error("Get Leg Details Error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* ================= GET NOTIFICATIONS ================= */
exports.getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    const limit = parseInt(req.query.limit) || 20;
    const notifications = user.getNotifications ? user.getNotifications(limit) : {
      unread: 0,
      notifications: []
    };

    // Also get FOMO notifications
    const fomoNotifications = await ReferralService.getFomoNotifications(user._id);

    res.json({
      success: true,
      notifications: notifications.notifications,
      unreadCount: notifications.unread,
      fomoNotifications: fomoNotifications.notifications,
      totalFomo: fomoNotifications.total
    });

  } catch (err) {
    console.error("Get Notifications Error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* ================= MARK NOTIFICATION READ ================= */
exports.markNotificationRead = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    const { notificationId } = req.params;
    
    if (notificationId === 'all') {
      // Mark all notifications as read
      if (user.notifications) {
        user.notifications.forEach(n => { n.read = true; });
      }
      if (user.missedCommissions) {
        user.missedCommissions.forEach(mc => { mc.read = true; });
      }
    } else {
      // Mark specific notification as read
      user.markNotificationRead(notificationId);
    }

    await user.save();

    res.json({
      success: true,
      message: "Notification marked as read"
    });

  } catch (err) {
    console.error("Mark Notification Read Error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* ================= GET UNLOCK STATUS ================= */
exports.getUnlockStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    const horizontalReqs = ReferralService.getHorizontalRequirements();
    const unlockStatus = [];

    for (let level = 1; level <= 21; level++) {
      const requiredDirects = horizontalReqs[level] || (level <= 3 ? 1 : 999);
      const isGloballyUnlocked = level <= 3 || user.legs.length >= requiredDirects;
      
      const legStatus = [];
      for (let i = 0; i < user.legs.length; i++) {
        const leg = user.legs[i];
        const levelKey = `level${level}`;
        const levelData = leg.levels[levelKey];
        
        legStatus.push({
          legNumber: leg.legNumber,
          isUnlocked: levelData?.isUnlocked || false,
          pendingUnlock: levelData?.pendingUnlock || false,
          usersCount: levelData?.users.length || 0,
          canUnlock: ReferralService.canUnlockLevel(user, level, i)
        });
      }

      unlockStatus.push({
        level,
        requiredDirects,
        currentDirects: user.legs.length,
        isGloballyUnlockable: isGloballyUnlocked,
        commissionRate: user.commissionRates?.[`level${level}`] || 0,
        legs: legStatus
      });
    }

    res.json({
      success: true,
      unlockStatus
    });

  } catch (err) {
    console.error("Get Unlock Status Error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};