const Scanner = require("../src/models/Scanner");

const expireOldRequests = async () => {
  try {
    const now = new Date();
    const tenMinutesAgo = new Date(now - 10 * 60 * 1000);

    // ✅ ACTIVE requests expire करा
    await Scanner.updateMany(
      { status: "ACTIVE", expiresAt: { $lt: now } },
      { $set: { status: "EXPIRED" } }
    );

    // ✅ ACCEPTED requests - acceptedAt पासून 10 min
    await Scanner.updateMany(
      { status: "ACCEPTED", acceptedAt: { $lt: tenMinutesAgo } },
      { $set: { status: "EXPIRED" } }
    );

    // ✅ PAYMENT_SUBMITTED - 30 min देतो confirm करायला
    const thirtyMinutesAgo = new Date(now - 30 * 60 * 1000);
    await Scanner.updateMany(
      { status: "PAYMENT_SUBMITTED", paymentSubmittedAt: { $lt: thirtyMinutesAgo } },
      { $set: { status: "EXPIRED" } }
    );

  } catch (err) {
    console.error("❌ Expire job error:", err);
  }
};

module.exports = expireOldRequests;