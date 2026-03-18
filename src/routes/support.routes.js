const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const SupportQuery = require('../models/SupportQuery'); // Model below
const userAuthMiddleware = require('../middlewares/userAuth.middleware');
const adminAuthMiddleware = require('../middlewares/adminAuth.middleware');
 
// ---- Multer Setup ----
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/support';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `query_${Date.now()}${path.extname(file.originalname)}`);
  }
});
 
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});
 
 
router.get('/my-queries', userAuthMiddleware, async (req, res) => {
  try {
const mongoId = req.user.id;  // ✅ फक्त id    
    // ✅ String compare करतो — ObjectId vs String issue नाही
    const queries = await SupportQuery.find({ userId: mongoId })
      .sort({ createdAt: -1 })
      .select('-__v');
      
    res.json({ success: true, data: queries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// ============================================================
// GET /api/support/admin/all — REPLACE करा
// ============================================================
router.get('/admin/all', adminAuthMiddleware, async (req, res) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;
 
    const total = await SupportQuery.countDocuments(filter);
    const queries = await SupportQuery.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-__v');
 
    res.json({
      success: true,
      data: { queries, total, page: Number(page), totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('Admin all queries error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});
// ============================================================
// POST /api/support/admin/reply/:queryId — REPLACE करा
// ============================================================
router.post('/admin/reply/:queryId', adminAuthMiddleware, async (req, res) => {
  try {
    const { message, status } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Reply message required' });
 
    const query = await SupportQuery.findById(req.params.queryId);
    if (!query) return res.status(404).json({ success: false, message: 'Query not found' });
 
    query.replies.push({
      from: 'admin',
      adminId:   req.admin.id,           // ✅ req.user → req.admin
      adminName: req.admin.userId || req.admin.email || 'Admin', // ✅
      message:   message.trim(),
      createdAt: new Date()
    });
 
    if (status) query.status = status;
    query.updatedAt    = new Date();
    query.hasUnreadReply = true;
    await query.save();
 
    res.json({ success: true, message: 'Reply sent successfully' });
  } catch (err) {
    console.error('Admin reply error:', err.message);
    res.status(500).json({ success: false, message: err.message }); // ✅ actual error दिसेल
  }
});
 
/// ============================================================
// PATCH /api/support/admin/status/:queryId — REPLACE करा
// ============================================================
router.patch('/admin/status/:queryId', adminAuthMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'Status required' });
 
    await SupportQuery.findByIdAndUpdate(
      req.params.queryId,
      { status, updatedAt: new Date() },
      { new: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Status update error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// Serve uploaded screenshots
router.get('/screenshot/:filename', userAuthMiddleware, (req, res) => {
  const filePath = path.join(__dirname, '../uploads/support', req.params.filename);
  if (fs.existsSync(filePath)) res.sendFile(filePath);
  else res.status(404).json({ success: false, message: 'File not found' });
});

// ============================================================
// FILE 2: routes/support.js  — POST /query route REPLACE करा
// ============================================================

// routes/support.js — POST /query route मध्ये हा REPLACE करा
// फक्त हा एक check बदला — बाकी सर्व same राहू द्या

router.post('/query', userAuthMiddleware, upload.single('screenshot'), async (req, res) => {
  try {
    const { subject, description, category } = req.body;

    if (!subject?.trim() || !description?.trim()) {
      return res.status(400).json({ success: false, message: 'Subject and description are required' });
    }

    const userId = req.user.id;        // ✅ JWT मध्ये 'id' आहे
const userDbId = req.user.userId;  // ✅ '160950'

if (!userId) {
  return res.status(401).json({ success: false, message: 'Unauthorized' });
}


    const queryId = `CPL-${Date.now().toString().slice(-7)}`;

    const query = await SupportQuery.create({
      queryId,
   userId:   userId,
userDbId: userDbId,
      subject:        subject.trim(),
      description:    description.trim(),
      category:       category || 'general',
      screenshotPath: req.file ? req.file.path : null,
      status:         'open',
      replies:        []
    });

    res.json({ success: true, data: { queryId: query.queryId, _id: query._id } });

  } catch (err) {
    console.error('Support query error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/support/query/:id — user gets own query detail
router.get('/query/:id', userAuthMiddleware, async (req, res) => {
  try {
    const query = await SupportQuery.findOne({
      _id: req.params.id,
      userId: req.user.id   // ✅ req.user.id
    });
    if (!query) return res.status(404).json({ success: false, message: 'Query not found' });
    res.json({ success: true, data: query });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
module.exports = router;