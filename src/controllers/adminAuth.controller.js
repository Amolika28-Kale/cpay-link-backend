// controllers/admin.controller.js
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Rate = require('../models/Rate');
const Scanner = require('../models/Scanner');
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');

// ================= ADMIN LOGIN =================
exports.login = async (req, res) => {
  try {
    let { adminId, pin } = req.body;

    console.log("👤 Admin login attempt:", { adminId });

    if (!adminId || !pin) {
      return res.status(400).json({ 
        success: false,
        message: "Admin ID and PIN are required" 
      });
    }

    // 6-digit validation
    if (!/^\d{6}$/.test(adminId)) {
      return res.status(400).json({ 
        success: false,
        message: "Admin ID must be 6 digits" 
      });
    }

    const admin = await Admin.findOne({ adminId });
    
    if (!admin) {
      return res.status(404).json({ 
        success: false,
        message: "Invalid admin credentials" 
      });
    }

    const match = await admin.comparePin(pin);    
    if (!match) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid admin credentials" 
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign(
      { 
        id: admin._id, 
        adminId: admin.adminId,
        role: admin.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          _id: admin._id,
          userId: admin.adminId,
          role: admin.role,
          name: admin.name
        }
      }
    });

  } catch (err) {
    console.error("❌ Admin login error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// ================= CREATE NEW ADMIN =================
exports.createAdmin = async (req, res) => {
  try {
    const { adminId, pin, name, email, role, permissions } = req.body;

    // 6-digit validation
    if (!/^\d{6}$/.test(adminId)) {
      return res.status(400).json({ 
        success: false,
        message: "Admin ID must be exactly 6 digits" 
      });
    }

    if (!pin || pin.length !== 6 || !/^\d+$/.test(pin)) {
      return res.status(400).json({ 
        success: false,
        message: "PIN must be 6 digits" 
      });
    }

    const existingAdmin = await Admin.findOne({ adminId });
    if (existingAdmin) {
      return res.status(400).json({ 
        success: false,
        message: "Admin ID already exists" 
      });
    }

    const admin = await Admin.create({
      adminId,
      pin,
      name: name || 'Admin',
      email,
      role: role || 'admin',
      permissions: permissions || ['all']
    });

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: {
        adminId: admin.adminId,
        name: admin.name,
        role: admin.role
      }
    });

  } catch (err) {
    console.error("❌ Create admin error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// ================= SET CONVERSION RATE =================
exports.setConversionRate = async (req, res) => {
  try {
    const { usdtToInr } = req.body;

    if (!usdtToInr || usdtToInr <= 0) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid rate" 
      });
    }

    // deactivate old
    await Rate.updateMany({}, { isActive: false });

    const rate = await Rate.create({
      usdtToInr,
      isActive: true
    });

    res.json({
      success: true,
      message: "Conversion rate updated successfully",
      data: rate
    });

  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// ================= GET ALL ADMINS =================
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find()
      .select('-pin')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: admins
    });

  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// ================= DELETE ADMIN =================
exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account"
      });
    }

    const admin = await Admin.findByIdAndDelete(id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    res.json({
      success: true,
      message: "Admin deleted successfully"
    });

  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// ================= SEED ADMIN =================
exports.seedAdmin = async () => {
  try {
    // Check for existing 6-digit admin IDs
    const existingAdmin = await Admin.findOne({ 
      $or: [
        { adminId: '777777' },
        { adminId: '888888' },
        { adminId: '999999' }
      ]
    });
    
    if (!existingAdmin) {
      // Create main admin
      await Admin.create({
        adminId: '777777',
        pin: '123456',
        name: 'Admin',
        role: 'admin',
        permissions: ['all']
      });

      // Create finance admin
      await Admin.create({
        adminId: '888888',
        pin: '123456',
        name: 'Finance Admin',
        role: 'admin',
        permissions: ['deposits', 'withdrawals']
      });

      // Create support admin
      await Admin.create({
        adminId: '999999',
        pin: '123456',
        name: 'Support Admin',
        role: 'admin',
        permissions: ['users', 'scanners']
      });

      console.log('━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ ADMINS SEEDED SUCCESSFULLY!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 Admin ID: 777777 | PIN: 123456 | Role: Admin');
      console.log('📋 Admin ID: 888888 | PIN: 123456 | Role: Finance Admin');
      console.log('📋 Admin ID: 999999 | PIN: 123456 | Role: Support Admin');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.log('✅ Admins already exist');
      
      // Show existing admins
      const admins = await Admin.find().select('-pin');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 Existing Admins:');
      admins.forEach(admin => {
        console.log(`   ${admin.adminId} - ${admin.name || 'Admin'} (${admin.role})`);
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━');
    }
  } catch (err) {
    console.error('❌ Error seeding admin:', err);
  }
};

// ================= SYSTEM REQUEST MANAGEMENT =================

/**
 * GET ALL USERS (for debugging and lookup)
 * GET /api/admin/all-users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, { userId: 1, email: 1, _id: 1 })
      .limit(50)
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      users: users.map(u => ({
        userId: u.userId,
        email: u.email,
        _id: u._id
      }))
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * CREATE SYSTEM REQUEST (Admin only)
 * POST /api/admin/create-system-request
 * Body: { userId: "user123" or "all", amount: 900 }
 */
exports.createSystemRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId, amount = 900 } = req.body;

    console.log("Creating system request for:", userId, "amount:", amount);

    let targetUsers = [];
    let isAllUsers = false;

    // ✅ Case 1: Send to ALL users
    if (userId === 'all' || userId === 'ALL' || userId === 'all-users') {
      isAllUsers = true;
      targetUsers = await User.find({ role: 'user' }).session(session);
      
      if (targetUsers.length === 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ 
          success: false, 
          message: "No users found" 
        });
      }
      console.log(`Creating requests for ${targetUsers.length} users`);
    } 
    // ✅ Case 2: Send to specific user
    else {
      let user = null;
      
      // Try to find by userId (string field)
      user = await User.findOne({ userId: userId }).session(session);
      
      // If not found and userId looks like a valid ObjectId, try by _id
      if (!user && mongoose.Types.ObjectId.isValid(userId)) {
        user = await User.findById(userId).session(session);
      }
      
      // If still not found, try by email
      if (!user) {
        user = await User.findOne({ email: userId }).session(session);
      }
      
      if (!user) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ 
          success: false, 
          message: `User not found with identifier: ${userId}` 
        });
      }
      
      targetUsers = [user];
    }

    // ✅ FIX: Get current time and add 10 minutes
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now
    
    console.log("Current time:", now.toISOString());
    console.log("Expires at:", expiresAt.toISOString());
    
    const defaultQRPath = "/uploads/auto-request-qr.png";
    const createdByAdmin = req.user && req.user.id ? req.user.id : null;
    
    // ✅ Create a group ID for all requests in this batch
    const groupRequestId = isAllUsers ? new mongoose.Types.ObjectId() : null;
    
    const createdRequests = [];
    const skippedUsers = [];

    // ✅ Create a separate request for each user
    for (const user of targetUsers) {
      // Check if user already has an active system request
      const existingActive = await Scanner.findOne({
        createdFor: user._id,
        isAutoRequest: true,
        status: { $in: ["ACTIVE", "ACCEPTED", "PAYMENT_SUBMITTED"] }
      }).session(session);
      
      if (existingActive) {
        console.log(`User ${user.userId} already has an active request, skipping...`);
        skippedUsers.push(user.userId);
        continue;
      }
      
      // ✅ Create system request with proper fields
      const scanner = new Scanner({
        user: null, // System request
        amount: amount,
        image: defaultQRPath,
        status: "ACTIVE",
        expiresAt: expiresAt, // ✅ 10 minutes from now
        isAutoRequest: true,
        autoRequestCycle: 1,
        createdFor: user._id,
        createdByAdmin: createdByAdmin,
        groupRequestId: groupRequestId
      });

      // ✅ Save with session
      await scanner.save({ session });
      
      console.log(`✅ System request created for ${user.userId} with ID: ${scanner._id}`);
      console.log(`   Status: ${scanner.status}, Expires: ${scanner.expiresAt}`);

      createdRequests.push(scanner);

      // Update user's auto request status
      if (!user.autoRequest) {
        user.autoRequest = {};
      }
      
      if (!user.autoRequest.firstRequestCreated) {
        user.autoRequest.firstRequestCreated = true;
        user.autoRequest.firstRequestId = scanner._id;
        user.autoRequest.firstRequestAmount = amount;
        user.autoRequest.firstRequestCreatedAt = new Date();
        user.autoRequest.firstRequestExpiresAt = expiresAt;
      }
      
      await user.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    // ✅ Build response message
    let message = '';
    if (isAllUsers) {
      message = `System requests of ₹${amount} created for ${createdRequests.length} users`;
      if (skippedUsers.length > 0) {
        message += ` (Skipped ${skippedUsers.length} users who already have active requests: ${skippedUsers.join(', ')})`;
      }
    } else {
      message = `System request of ₹${amount} created for user ${targetUsers[0]?.userId}`;
    }

    res.json({
      success: true,
      message: message,
      requests: createdRequests,
      totalCreated: createdRequests.length,
      totalTargeted: targetUsers.length,
      skippedUsers: skippedUsers,
      groupId: groupRequestId,
      isAllUsers: isAllUsers
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating system request:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * GET ALL SYSTEM REQUESTS (Admin view)
 * GET /api/admin/system-requests
 */
exports.getSystemRequests = async (req, res) => {
  try {
    const requests = await Scanner.find({ 
      isAutoRequest: true,
      status: { $in: ["ACTIVE", "ACCEPTED", "PAYMENT_SUBMITTED", "COMPLETED"] }
    })
    .populate("user", "userId name email")           // ✅ userId add केला
    .populate("acceptedBy", "userId name email")     // ✅ userId add केला  
    .populate("createdFor", "userId name email")     // ✅ already होता, userId check करा
    .sort({ createdAt: -1 });

    console.log(`Found ${requests.length} system requests`);

    // ✅ Group requests by groupRequestId for better display
    const groupedRequests = {};
    const ungroupedRequests = [];

    requests.forEach(req => {
      if (req.groupRequestId) {
        if (!groupedRequests[req.groupRequestId]) {
          groupedRequests[req.groupRequestId] = {
            groupId: req.groupRequestId,
            amount: req.amount,
            createdAt: req.createdAt,
            totalUsers: 0,
            acceptedBy: null,
            completed: false,
            acceptedCount: 0,
            pendingCount: 0,
            requests: []
          };
        }
        
        groupedRequests[req.groupRequestId].requests.push(req);
        groupedRequests[req.groupRequestId].totalUsers++;
        
        if (req.status === 'COMPLETED') {
          groupedRequests[req.groupRequestId].completed = true;
          groupedRequests[req.groupRequestId].acceptedCount++;
        }
        if (req.status === 'ACCEPTED' || req.status === 'PAYMENT_SUBMITTED') {
          groupedRequests[req.groupRequestId].acceptedCount++;
          if (!groupedRequests[req.groupRequestId].acceptedBy) {
            groupedRequests[req.groupRequestId].acceptedBy = req.acceptedBy;
          }
        }
        if (req.status === 'ACTIVE') {
          groupedRequests[req.groupRequestId].pendingCount++;
        }
      } else {
        ungroupedRequests.push(req);
      }
    });

    res.json({
      success: true,
      groupedRequests: Object.values(groupedRequests),
      singleRequests: ungroupedRequests,
      allRequests: requests // For backward compatibility
    });

  } catch (error) {
    console.error("Error fetching system requests:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * CONFIRM SYSTEM REQUEST (Admin confirms after viewing proof)
 * POST /api/admin/confirm-system-request
 */
exports.confirmSystemRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { scannerId } = req.body;

    console.log("Confirming system request:", scannerId);

    const scanner = await Scanner.findById(scannerId).session(session);
    if (!scanner) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ 
        success: false, 
        message: "Request not found" 
      });
    }

    if (scanner.status !== "PAYMENT_SUBMITTED") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: `Request is in ${scanner.status} state, not PAYMENT_SUBMITTED` 
      });
    }

    // ✅ If this is a group request, mark ALL other requests as EXPIRED
    if (scanner.groupRequestId) {
      await Scanner.updateMany(
        {
          groupRequestId: scanner.groupRequestId,
          _id: { $ne: scanner._id },
          status: { $in: ["ACTIVE", "ACCEPTED"] }
        },
        {
          status: "EXPIRED",
          expiresAt: new Date()
        },
        { session }
      );
      console.log(`Marked other requests in group ${scanner.groupRequestId} as EXPIRED`);
    }

    const acceptorId = scanner.acceptedBy;
    const amount = scanner.amount;
    const createdForId = scanner.createdFor;

    console.log("Acceptor ID:", acceptorId, "Amount:", amount);

    // Credit INR to acceptor
    let acceptorWallet = await Wallet.findOne({ user: acceptorId, type: "INR" }).session(session);
    if (!acceptorWallet) {
      acceptorWallet = new Wallet({ user: acceptorId, type: "INR", balance: 0 });
    }
    acceptorWallet.balance += amount;
    await acceptorWallet.save({ session });
    console.log(`Credited ₹${amount} to acceptor's INR wallet`);

    // Credit cashback to acceptor (5%)
    const acceptorCashback = Number((amount * 0.05).toFixed(2));
    let cashbackWallet = await Wallet.findOne({ user: acceptorId, type: "CASHBACK" }).session(session);
    if (!cashbackWallet) {
      cashbackWallet = new Wallet({ user: acceptorId, type: "CASHBACK", balance: 0 });
    }
    cashbackWallet.balance += acceptorCashback;
    await cashbackWallet.save({ session });
    console.log(`Credited ₹${acceptorCashback} cashback to acceptor`);

    // Update scanner status
    scanner.status = "COMPLETED";
    scanner.completedAt = new Date();
    await scanner.save({ session });

    // Update user's auto request status
    if (createdForId) {
      const user = await User.findById(createdForId).session(session);
      if (user && user.autoRequest) {
        if (scanner.autoRequestCycle === 1) {
          user.autoRequest.firstRequestCompleted = true;
          user.autoRequest.firstRequestCompletedAt = new Date();
        } else if (scanner.autoRequestCycle === 2) {
          user.autoRequest.secondRequestCompleted = true;
          user.autoRequest.secondRequestCompletedAt = new Date();
        }
        
        user.autoRequest.autoRequestsAccepted = (user.autoRequest.autoRequestsAccepted || 0) + 1;
        await user.save({ session });
      }
    }

    // ✅ FIXED: Create transactions with proper values
    // Transaction 1: CREDIT
    const creditTransaction = new Transaction({
      user: acceptorId,
      type: "CREDIT",  // ✅ Use valid enum value
      fromWallet: "SYSTEM",
      toWallet: "INR",
      amount: amount,
      relatedScanner: scanner._id,
      
    });
    await creditTransaction.save({ session });

    // Transaction 2: CASHBACK
    const cashbackTransaction = new Transaction({
      user: acceptorId,
      type: "CASHBACK",  // ✅ Use valid enum value
      fromWallet: "SYSTEM",
      toWallet: "CASHBACK",
      amount: acceptorCashback,
      relatedScanner: scanner._id,
      meta: { 
        type: "CASHBACK",
        isAutoRequest: true,
        cycle: scanner.autoRequestCycle
      }
    });
    await cashbackTransaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Schedule next request after 15 minutes (if this was first request)
    if (createdForId && scanner.autoRequestCycle === 1) {
      console.log(`Scheduling next request in 15 minutes for user ${createdForId}`);
      setTimeout(async () => {
        try {
          await exports.createNextSystemRequest(createdForId, amount);
        } catch (err) {
          console.error("Error creating next system request:", err);
        }
      }, 15 * 60 * 1000); // 15 minutes
    }

    res.json({
      success: true,
      message: "System request confirmed successfully",
      amount: amount,
      cashback: acceptorCashback
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error confirming system request:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Create next system request (internal function)
 */
exports.createNextSystemRequest = async (userId, amount) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (!user) {
      console.log("User not found for next request:", userId);
      await session.abortTransaction();
      session.endSession();
      return;
    }

    // Check if second request already exists
    if (user.autoRequest?.secondRequestCreated) {
      console.log("Second request already exists for user:", userId);
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const defaultQRPath = "/uploads/auto-request-qr.png";
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // ✅ FIXED: Create a single document, not an array
    const scanner = await Scanner.create({
      user: null,
      amount: amount,
      image: defaultQRPath,
      status: "ACTIVE",
      expiresAt: expiresAt,
      isAutoRequest: true,
      autoRequestCycle: 2,
      createdFor: userId
    }, { session });

    // Initialize autoRequest if needed
    if (!user.autoRequest) {
      user.autoRequest = {};
    }
    
    user.autoRequest.secondRequestCreated = true;
    user.autoRequest.secondRequestId = scanner._id;
    user.autoRequest.secondRequestAmount = amount;
    user.autoRequest.secondRequestCreatedAt = new Date();
    user.autoRequest.secondRequestExpiresAt = expiresAt;
    user.autoRequest.autoRequestCompleted = true;

    await user.save({ session });
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ Next system request created for user ${user.userId}`);

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating next system request:", error);
  }
};

