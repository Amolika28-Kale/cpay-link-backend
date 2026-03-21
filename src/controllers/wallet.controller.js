const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { default: mongoose } = require('mongoose');
const ReferralService = require('../../services/referralService');
const User = require('../models/User');


exports.getWallets = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // ✅ Safe user load
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Safe held deposits check - heldDeposits नसेल तरी crash नाही
    const heldDeposits = user.heldDeposits || [];
    
    // Auto-release expired holds
    if (heldDeposits.length > 0) {
      let changed = false;
      heldDeposits.forEach(h => {
        if (!h.released && h.heldUntil <= now) {
          h.released = true;
          changed = true;
        }
      });
      if (changed) await user.save();
    }

    // Calculate held amount
    const heldAmount = heldDeposits
      .filter(h => !h.released && h.heldUntil > now)
      .reduce((sum, h) => sum + (h.amount || 0), 0);

    // Next release time
    const nextReleaseAt = heldDeposits
      .filter(h => !h.released && h.heldUntil > now)
      .sort((a, b) => a.heldUntil - b.heldUntil)[0]?.heldUntil || null;

    const wallets = await Wallet.find({ user: userId });

    // ✅ Always return array
    const enrichedWallets = wallets.map(w => {
      const obj = w.toObject();
      if (w.type === 'INR') {
        return {
          ...obj,
          heldBalance: Math.round(heldAmount),
          availableBalance: Math.max(0, Math.round(w.balance - heldAmount)),
          nextReleaseAt
        };
      }
      return obj;
    });

    res.json(enrichedWallets); // ✅ Array return करतो
    
  } catch (err) {
    console.error("getWallets error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getWalletSummary = async (req, res) => {
  try {
    const wallets = await Wallet.find({ user: req.user.id });

    const summary = {
      USDT: 0,
      INR: 0,
      CASHBACK: 0
    };

    wallets.forEach(w => {
      summary[w.type] = w.balance;
    });

    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getCurrentRate = async (req, res) => {
  try {
    // Simulated rate - in a real app, this would come from an API or database
    res.json({ rate: 90 }); // 1 USDT = ₹90
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.selfPay = async (req, res) => {
  const { amount, qrData } = req.body;
  const userId = req.user.id;

  const wallet = await Wallet.findOne({ user: userId, type: "INR" });

  if (!wallet || wallet.balance < amount) {
    return res.status(400).json({ message: "Insufficient Balance" });
  }

  wallet.balance -= Number(amount);
  await wallet.save();

  await Transaction.create({
    user: userId,
    type: "SELF_PAY",
    amount,
    qrData,
    status: "completed"
  });

  res.json({ message: "Payment Successful" });
};


exports.transferCashback = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const cashbackWallet = await Wallet.findOne({ user: userId, type: 'CASHBACK' });
    const inrWallet = await Wallet.findOne({ user: userId, type: 'INR' });

    if (!cashbackWallet || cashbackWallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient cashback balance' });
    }

    cashbackWallet.balance -= amount;
    inrWallet.balance += amount;

    await cashbackWallet.save();
    await inrWallet.save();

    // Create transaction record
    await Transaction.create({
      user: userId,
      type: 'CASHBACK_TRANSFER',
      fromWallet: 'CASHBACK',
      toWallet: 'INR',
      amount
    });

    // Process team cashback for uplines (when user redeems cashback)
    await ReferralService.processTeamCashback(userId, amount, 'CASHBACK_REDEEM');

    res.json({ 
      message: 'Transfer successful',
      transferredAmount: amount 
    });
  } catch (err) {
    // console.error("Transfer cashback error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

// controllers/wallet.controller.js - यामध्ये console.log जोडा

exports.getTeamCashbackSummary = async (req, res) => {
  try {
    // console.log("📥 Getting team cashback summary for user:", req.user.id);
    
    const summary = await ReferralService.getTeamCashbackSummary(req.user.id);
    
    // console.log("📤 Team cashback summary:", JSON.stringify(summary, null, 2));
    
    res.json(summary || {});
  } catch (err) {
    // console.error("Team cashback summary error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


