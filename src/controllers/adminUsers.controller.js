const User = require('../models/User');
const Wallet = require('../models/Wallet');

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

    const enrichedUsers = users.map(user => {
      const uid = user._id.toString();
      
      // Calculate stats from legs (new structure)
      const legs = user.legs || [];
      const teamCount = legs.reduce((sum, leg) => sum + (leg.stats?.totalUsers || 0), 0);
      const totalEarnings = legs.reduce((sum, leg) => sum + (leg.stats?.totalEarnings || 0), 0);
      const totalTeamCashback = legs.reduce((sum, leg) => sum + (leg.stats?.totalTeamCashback || 0), 0);

      return {
        ...user,
        wallets: {
          USDT: walletMap[uid]?.USDT || 0,
          INR: walletMap[uid]?.INR || 0,
          CASHBACK: walletMap[uid]?.CASHBACK || 0
        },
        // Keep legs as-is (already populated)
        legs: legs,
        // Computed stats for quick display
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


