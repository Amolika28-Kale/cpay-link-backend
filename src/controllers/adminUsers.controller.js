const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Deposit = require('../models/Deposit'); // ← हे add करा

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-pin')
      .populate('referredBy', 'userId email')
      .populate('legs.rootUser', 'userId email')
      .lean();

    // Get all wallets in one query
    const allWallets = await Wallet.find().lean();
    const walletMap = {};
    allWallets.forEach(w => {
      const uid = w.user?.toString();
      if (!uid) return;
      if (!walletMap[uid]) walletMap[uid] = {};
      walletMap[uid][w.type] = w.balance;
    });

    // ✅ Today's date (midnight)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // ✅ Deposit aggregate - one query for all users
    const depositStats = await Deposit.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: '$user',
          totalDeposit: { $sum: '$amount' },
          depositCount: { $sum: 1 },
          todayDeposit: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', todayStart] },
                '$amount',
                0
              ]
            }
          }
        }
      }
    ]);

    // ✅ Map बनवा - O(1) lookup
    const depositMap = {};
    depositStats.forEach(d => {
      depositMap[d._id.toString()] = d;
    });

    const enrichedUsers = users.map(user => {
      const uid = user._id.toString();
      
      const legs = user.legs || [];
      const teamCount = legs.reduce((sum, leg) => sum + (leg.stats?.totalUsers || 0), 0);
      const totalEarnings = legs.reduce((sum, leg) => sum + (leg.stats?.totalEarnings || 0), 0);
      const totalTeamCashback = legs.reduce((sum, leg) => sum + (leg.stats?.totalTeamCashback || 0), 0);

      // ✅ Deposit data
      const depData = depositMap[uid] || {};

      return {
        ...user,
        wallets: {
          USDT: walletMap[uid]?.USDT || 0,
          INR: walletMap[uid]?.INR || 0,
          CASHBACK: walletMap[uid]?.CASHBACK || 0
        },
        legs: legs,
        // ✅ Deposit fields
        totalDeposit: depData.totalDeposit || 0,
        todayDeposit: depData.todayDeposit || 0,
        depositCount: depData.depositCount || 0,
        _computed: {
          teamCount,
          totalEarnings,
          totalTeamCashback,
          directCount: legs.length
        }
      };
    });

    res.json(enrichedUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


