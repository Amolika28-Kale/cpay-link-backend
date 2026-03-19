const express = require('express');
const router = express.Router();

const adminAuth = require('../middlewares/adminAuth.middleware');

const { login, setConversionRate, createAdmin, getAllAdmins, deleteAdmin } = require('../controllers/adminAuth.controller');
const { getAllUsers, deleteUser } = require('../controllers/adminUsers.controller');
const { getAllDeposits, approveDeposit, rejectDeposit } = require('../controllers/deposit.controller');
const { getAllWithdraws, approveWithdraw, rejectWithdraw } = require('../controllers/withdraw.controller');
const { togglePaymentMethod, getAllPaymentMethods } = require('../controllers/paymentMethodController');
const { getSystemStats, getUserDetails, getAllUsersWithReferrals, getUserLegBreakdown, getLegLevelUsers } = require('../controllers/adminStats.controller'); // ✅ नवीन
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Scanner = require('../models/Scanner');
const { default: mongoose } = require('mongoose');

// Public
router.post('/login', login);

// Admin Management
router.post('/create', createAdmin);
router.get('/list', getAllAdmins);
router.delete('/:id', deleteAdmin);

// System Stats - ✅ नवीन
router.get('/stats', adminAuth, getSystemStats);
router.get('/users/:userId', adminAuth, getUserDetails);

// Settings
router.post('/set-rate', adminAuth, setConversionRate);
router.put('/payment-method/:id/toggle', adminAuth, togglePaymentMethod);

// Users
router.get('/users', adminAuth, getAllUsers);
router.delete('/users/:id', adminAuth, deleteUser);

// Deposits
router.get('/deposits', adminAuth, getAllDeposits);
router.put('/deposits/:id/approve', adminAuth, approveDeposit);
router.put('/deposits/:id/reject', adminAuth, rejectDeposit);

// Withdraws
router.get('/withdraws', adminAuth, getAllWithdraws);
router.put('/withdraws/:id/approve', adminAuth, approveWithdraw);
router.put('/withdraws/:id/reject', adminAuth, rejectWithdraw);

// Payment Methods
router.get('/payment-methods', adminAuth, getAllPaymentMethods);
// Get all users with complete referral details
router.get('/users-with-referrals', adminAuth, getAllUsersWithReferrals);

router.get('/user/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    let user;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId)
        .select('-pin')
        .populate('referredBy', 'userId email')
        .populate('legs.rootUser', 'userId email')  // ADD THIS
        .lean();
    } else {
      user = await User.findOne({ userId })
        .select('-pin')
        .populate('referredBy', 'userId email')
        .populate('legs.rootUser', 'userId email')  // ADD THIS
        .lean();
    }
    
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const transactions = await Transaction.find({ user: user._id })
      .sort({ createdAt: -1 }).limit(50);
    
    const createdScanners = await Scanner.find({ user: user._id })
      .populate('acceptedBy', 'userId email');
    const acceptedScanners = await Scanner.find({ acceptedBy: user._id })
      .populate('user', 'userId email');
    
    const wallets = await Wallet.find({ user: user._id });

    // Build team from legs (new structure)
    const legs = user.legs || [];
    let teamCount = 0;
    const teamLevels = [];
    
    for (let level = 1; level <= 21; level++) {
      let levelUserIds = [];
      for (const leg of legs) {
        const lvl = leg.levels?.[`level${level}`];
        if (lvl?.users?.length > 0) levelUserIds.push(...lvl.users);
      }
      teamCount += levelUserIds.length;
      if (levelUserIds.length > 0) {
        // Fetch member details
        const members = await User.find(
          { _id: { $in: levelUserIds } },
          'userId email totalEarnings earningsByLevel'
        ).lean();
        
        teamLevels.push({
          level,
          count: levelUserIds.length,
          members: members.map(m => ({
            userId: m.userId,
            email: m.email,
            earnings: m.totalEarnings || 0
          }))
        });
      }
    }

    // Build earnings from earningsByLevel (new field)
    const earnings = { total: user.totalEarnings || 0 };
    for (let i = 1; i <= 21; i++) {
      earnings[`level${i}`] = user.earningsByLevel?.[`level${i}`] || 0;
    }

    // Build teamCashback from legs level data
    const teamCashback = {};
    for (let i = 1; i <= 21; i++) {
      let total = 0, count = 0;
      for (const leg of legs) {
        const lvl = leg.levels?.[`level${i}`];
        if (lvl) {
          total += lvl.teamCashback || 0;
          count += lvl.users?.length || 0;
        }
      }
      if (total > 0) teamCashback[`level${i}`] = { total, count };
    }

    res.json({
      success: true,
      user: {
        ...user,
        wallets: wallets.reduce((acc, w) => ({ ...acc, [w.type]: w.balance }), {}),
        transactions,
        scanners: { created: createdScanners, accepted: acceptedScanners },
        team: { total: teamCount, levels: teamLevels },
        earnings,
        teamCashback,
        totalPayRequests: user.totalPayRequests || 0,
        totalAcceptedRequests: user.totalAcceptedRequests || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/leg-breakdown/:userId', adminAuth, getUserLegBreakdown);

router.get('/leg-users/:legNumber/:level', adminAuth, getLegLevelUsers);

// Get users in a specific leg and level FOR A SPECIFIC USER
router.get('/user/:userId/leg/:legNumber/level/:level', adminAuth, async (req, res) => {
  try {
    const { userId, legNumber, level } = req.params;
    const legNum = parseInt(legNumber);
    const levelNum = parseInt(level);
    const levelKey = `level${levelNum}`;

    const user = await User.findById(userId)
      .select('legs userId email')
      .lean();

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Find the specific leg
    const targetLeg = user.legs?.find(leg => leg.legNumber === legNum);
    if (!targetLeg) {
      return res.json({ success: true, data: { users: [], totalUsers: 0 } });
    }

    // Get user IDs from that specific level
    const levelUserIds = targetLeg.levels?.[levelKey]?.users || [];
    
    if (levelUserIds.length === 0) {
      return res.json({ success: true, data: { users: [], totalUsers: 0 } });
    }

    // Fetch full user details
    const levelUsers = await User.find({ _id: { $in: levelUserIds } })
      .select('userId email referralCode totalEarnings legs directReferralsCount wallets createdAt')
      .lean();

    const formattedUsers = levelUsers.map(u => ({
      _id: u._id,
      userId: u.userId,
      email: u.email,
      referralCode: u.referralCode,
      totalEarnings: u.totalEarnings || 0,
      directCount: u.legs?.length || u.directReferralsCount || 0,
      teamCount: u.legs?.reduce((sum, l) => sum + (l.stats?.totalUsers || 0), 0) || 0,
      joinedAt: u.createdAt,
      wallets: {
        USDT: u.wallets?.USDT || 0,
        INR: u.wallets?.INR || 0,
        CASHBACK: u.wallets?.CASHBACK || 0
      }
    }));

    res.json({
      success: true,
      data: {
        legNumber: legNum,
        level: levelNum,
        totalUsers: formattedUsers.length,
        levelEarnings: targetLeg.levels?.[levelKey]?.earnings || 0,
        levelTeamCashback: targetLeg.levels?.[levelKey]?.teamCashback || 0,
        users: formattedUsers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
module.exports = router;


