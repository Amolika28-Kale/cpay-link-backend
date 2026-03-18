const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routes/user.routes");
const adminRoutes = require("./routes/admin.routes");
const depositRoutes = require("./routes/deposit.routes");
const withdrawRoutes = require("./routes/withdraw.routes");
const scannerRoutes = require("./routes/scanner.routes");
const walletRoutes = require("./routes/wallet.routes");
const conversionRoutes = require("./routes/conversion.routes");
const transactionRoutes = require("./routes/transaction.routes");
const paymentMethodRoutes = require("./routes/payment.routes");
const AutoRequestService = require("../services/autoRequestService");
const findAccountRoutes = require("./routes/findAccount.routes");
const supportRoutes = require('./routes/support.routes');
const app = express();

/* =================================
   MIDDLEWARE
================================= */

// JSON parser
app.use(express.json());

// CORS (Mobile + Web Compatible)
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "https://cpay-link.netlify.app",
      "https://cpaylink.io",
      "www.cpaylink.io",
      "https://www.cpaylink.io",

    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight requests
app.options(/.*/, cors());

// Static folder
app.use("/uploads", express.static("uploads"));

/* =================================
   DATABASE CONNECTION
================================= */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");

    AutoRequestService.startScheduledJobs();
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

/* =================================
   HEALTH CHECK
================================= */

app.get("/", (req, res) => {
  res.send("Backend Working 🚀");
});

/* =================================
   API ROUTES
================================= */

app.use("/api/auth", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/deposit", depositRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/scanner", scannerRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/conversion", conversionRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/find", findAccountRoutes);
app.use("/api/support",supportRoutes);



/* =================================
   GLOBAL ERROR HANDLER
================================= */

app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

/* =================================
   EXPORT APP
================================= */

module.exports = app;