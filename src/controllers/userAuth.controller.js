

// controllers/userAuth.controller.js
const User = require('../models/User');
const Wallet = require('../models/Wallet'); // ✅ IMPORT MISSING
const Transaction = require('../models/Transaction');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose'); // ✅ ADD THIS
const ReferralService = require('../../services/referralService');
const AutoRequestService = require("../../services/autoRequestService"); // ✅ IMPORT AT TOP

// Register new user
const register = async (req, res) => {
  let session = null; // ✅ DECLARE SESSION
  
  try {
    const { userId, email, pin, referralCode } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ userId }, { email }] });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "User ID or Email already exists" 
      });
    }

    // Find referrer if referral code provided
let referrer = null;
if (referralCode) {
  referrer = await User.findOne({ referralCode });
  if (!referrer) {
    return res.status(400).json({
      success: false,
      message: "Invalid referral code"
    });
  }
}

    // ✅ START SESSION
    session = await mongoose.startSession();
    session.startTransaction();

    // Create new user
    const user = new User({
      userId,
      email,
      pin,
      referredBy: referrer ? referrer._id : null
    });

    await user.save({ session, validateBeforeSave: false });

    // ✅ 8. Create default wallets with BONUS
    const BONUS_USDT = 1; // $1 USDT बोनस
    const CONVERSION_RATE = 95; // 1 USDT = ₹95
    
    // USDT Wallet with $1 bonus
    const usdtWallet = new Wallet({
      user: user._id,
      type: "USDT",
      balance: BONUS_USDT // ✅ $1 बोनस
    });
    await usdtWallet.save({ session });

    // INR Wallet with ₹95 (from conversion)
    const inrWallet = new Wallet({
      user: user._id,
      type: "INR",
      balance: BONUS_USDT * CONVERSION_RATE // ✅ ₹95 बोनस
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

    // If referred, add to referrer's tree
    if (referrer) {
      await User.addToReferralTree(user._id, referrer._id, session); // ✅ PASS SESSION
    }

// ✅ 11. Create FIRST AUTO REQUEST for new user
let autoRequest = null;
try {
  autoRequest = await AutoRequestService.createFirstAutoRequestForUser(user._id, 900);
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
    // ✅ ABORT TRANSACTION IF SESSION EXISTS
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    console.error("Register Error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message || "Internal Server Error"
    });
  }
};

// Login user (unchanged)
const login = async (req, res) => {
  try {
    const { userId, pin } = req.body;

    // Find user
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid User ID or PIN" 
      });
    }

    // Check PIN
    const isMatch = await bcrypt.compare(pin, user.pin);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid User ID or PIN" 
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, userId: user.userId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        userId: user.userId,
        email: user.email,
        role: user.role,
        referralCode: user.referralCode,
        directReferrals: user.legs?.length || 0,
        totalEarnings: user.totalEarnings || 0
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get referral statistics
const getReferralStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const directReferralsCount = user.legs?.length || 0;
    
    // Calculate total team
    let totalTeam = 0;
    for (const leg of user.legs || []) {
      for (let level = 1; level <= 21; level++) {
        totalTeam += leg.levels?.[`level${level}`]?.users?.length || 0;
      }
    }

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        directReferrals: directReferralsCount,
        totalTeam: totalTeam,
        totalEarnings: user.totalEarnings || 0,
        legs: user.legs?.length || 0,
        unlockedLevels: directReferralsCount,
        isFullyUnlocked: directReferralsCount === 21
      }
    });

  } catch (error) {
    console.error("Referral stats error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get specific leg details
const getLegDetails = async (req, res) => {
  try {
    const { legNumber } = req.params;
    const legNum = parseInt(legNumber);
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const leg = user.legs?.find(l => l.legNumber === legNum);
    
    if (!leg) {
      return res.status(404).json({ success: false, message: "Leg not found" });
    }

    const directReferralsCount = user.legs?.length || 0;

    // Build leg details
    const legDetails = {
      legNumber: leg.legNumber,
      rootUser: leg.rootUser,
      joinedAt: leg.joinedAt,
      totalUsers: leg.stats?.totalUsers || 0,
      totalEarnings: leg.stats?.totalEarnings || 0,
      unlockedLevels: directReferralsCount,
      isFullyUnlocked: directReferralsCount === 21,
      levels: {}
    };

    // Add level-wise data
    for (let level = 1; level <= 21; level++) {
      const levelData = leg.levels?.[`level${level}`];
      legDetails.levels[`level${level}`] = {
        users: levelData?.users?.length || 0,
        earnings: levelData?.earnings || 0,
        teamCashback: levelData?.teamCashback || 0,
        isUnlocked: level <= directReferralsCount
      };
    }

    res.json({
      success: true,
      data: legDetails
    });

  } catch (error) {
    console.error("Leg details error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get notifications
const getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const notifications = user.getNotifications ? 
      user.getNotifications(50) : 
      { unread: 0, notifications: user.notifications || [] };

    res.json({
      success: true,
      data: notifications
    });

  } catch (error) {
    console.error("Notifications error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark notification as read
const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.markNotificationRead(notificationId);
    await user.save();

    res.json({
      success: true,
      message: "Notification marked as read"
    });

  } catch (error) {
    console.error("Mark notification error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/profile
exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select('-pin').lean();
  res.json({ success: true, user });
};

// PUT /api/auth/update-email
exports.updateEmail = async (req, res) => {
  const { email } = req.body;
  const exists = await User.findOne({ email, _id: { $ne: req.user.id } });
  if (exists) return res.status(400).json({ success: false, message: "Email already in use" });
  await User.findByIdAndUpdate(req.user.id, { email });
  res.json({ success: true, message: "Email updated" });
};

// PUT /api/auth/update-pin
exports.updatePin = async (req, res) => {
  const { currentPin, newPin } = req.body;
  const user = await User.findById(req.user.id);
  const isMatch = await bcrypt.compare(currentPin, user.pin);
  if (!isMatch) return res.status(400).json({ success: false, message: "Current PIN is incorrect" });
  user.pin = newPin; // pre-save hook will hash it
  await user.save();
  res.json({ success: true, message: "PIN updated" });
};

module.exports = {
  register,
  login,
  getReferralStats,
  getLegDetails,
  getNotifications,
  markNotificationRead
};