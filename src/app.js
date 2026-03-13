const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const depositRoutes = require('./routes/deposit.routes');
const withdrawRoutes = require("./routes/withdraw.routes");
const scannerRoutes = require('./routes/scanner.routes');
const walletRoutes = require('./routes/wallet.routes');
const conversionRoutes = require("./routes/conversion.routes");
const transactionRoutes = require("./routes/transaction.routes");
const paymentMethodRoutes = require('./routes/payment.routes');
const findAccountRoutes = require("./routes/findAccount.routes");

// ✅ FIXED: AutoRequestService चा योग्य path
let AutoRequestService;
try {
  // `../services/autoRequestService` ऐवजी `./services/autoRequestService` वापरा
  AutoRequestService = require('../services/autoRequestService');
  console.log('✅ AutoRequestService loaded successfully');
} catch (error) {
  console.warn('⚠️ AutoRequestService not found, continuing without it');
  console.warn('📁 Please create services/autoRequestService.js if needed');
  AutoRequestService = { 
    startScheduledJobs: () => console.log('⚠️ AutoRequestService not available') 
  };
}

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "https://crypto-cpay.netlify.app"],
  credentials: true
}));

app.use(express.json());
app.use("/uploads", express.static("uploads"));

// ✅ FIXED: MongoDB connection - जुने options काढून टाकले
console.log('🔄 Connecting to MongoDB...');
console.log(`📌 MongoDB URI: ${process.env.MONGO_URI ? '✅ Found' : '❌ Not Found'}`);

mongoose.connect(process.env.MONGO_URI, {
  // फक्त हे दोन options ठेवले आहेत (हे सपोर्ट केले जातात)
  retryWrites: true,
  w: 'majority'
})
.then(() => {
  console.log('✅✅✅ MongoDB Connected Successfully ✅✅✅');
  console.log(`📦 Database Name: ${mongoose.connection.name}`);
  console.log(`🌐 Host: ${mongoose.connection.host}`);
  console.log(`🔌 Port: ${mongoose.connection.port}`);
  
  // ✅ Start Auto Request Service after database connection
  if (AutoRequestService && typeof AutoRequestService.startScheduledJobs === 'function') {
    AutoRequestService.startScheduledJobs();
    console.log('✅ Auto Request Scheduler Started');
  }
})
.catch(err => {
  console.error('❌❌❌ MongoDB Connection Error ❌❌❌');
  console.error(`❌ Error Message: ${err.message}`);
  console.error('💡 Possible Solutions:');
  console.error('   1. Check if MongoDB is running: net start MongoDB');
  console.error('   2. Check MONGO_URI in .env file');
  console.error('   3. Try using 127.0.0.1 instead of localhost');
  console.error('   4. Make sure MongoDB is installed');
  process.exit(1);
});

// Routes
app.get("/", (req, res) => {
  res.send("🚀 CPayLink Backend Working | Server Status: ✅ Active");
});

app.get("/api/status", (req, res) => {
  res.json({
    status: 'active',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/deposit', depositRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use('/api/scanner', scannerRoutes);
app.use('/api/wallet', walletRoutes);
app.use("/api/conversion", conversionRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/find", findAccountRoutes);

module.exports = app;