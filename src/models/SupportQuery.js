// ============================================================
// FILE 1: models/SupportQuery.js  — REPLACE करा
// ============================================================

const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
  from:      { type: String, enum: ['admin', 'user'], required: true },
  adminId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminName: String,
  message:   { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const SupportQuerySchema = new mongoose.Schema({
  queryId:        { type: String, unique: true, required: true },

  // ✅ FIX: userId ObjectId reference (req.user._id)
userId: { type: mongoose.Schema.Types.Mixed, required: true },
  // ✅ FIX: userDbId = user's custom userId string (e.g. "438712")
  userDbId:       { type: String, default: '' },

  subject:        { type: String, required: true },
  description:    { type: String, required: true },
  category:       { type: String, enum: ['general','payment','wallet','referral','withdrawal','account'], default: 'general' },
  screenshotPath: { type: String, default: null },
  status:         { type: String, enum: ['open','in_progress','resolved','closed'], default: 'open' },
  replies:        [ReplySchema],
  hasUnreadReply: { type: Boolean, default: false },
  createdAt:      { type: Date, default: Date.now },
  updatedAt:      { type: Date, default: Date.now }
});

module.exports = mongoose.model('SupportQuery', SupportQuerySchema);




// ============================================================
// DEBUGGING: हे तुमच्या auth middleware मध्ये check करा
// protect middleware नंतर req.user मध्ये काय आहे ते log करा:
// ============================================================

// तुमच्या protect middleware च्या शेवटी हे add करा (temporary):
// console.log("req.user:", req.user?._id, req.user?.userId);

// req.user मध्ये userId field नसेल तर तुमच्या User model मध्ये
// field चे नाव वेगळे असेल — जसे: req.user.customId, req.user.userID
// त्यानुसार वरील userDbId line बदला:
// userDbId: req.user.userId || req.user.userID || req.user.customId || '',