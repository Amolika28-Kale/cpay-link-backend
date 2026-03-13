require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./src/models/Admin');

const seedAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const admins = [
      {
        adminId: "987456",
        pin: "121212",
        name: "Admin",
        role: "admin",
        permissions: ["all"]
      },
      {
        adminId: "888888",
        pin: "123456",
        name: "Finance Admin",
        permissions: ["deposits", "withdrawals"]
      },
      {
        adminId: "999999",
        pin: "123456",
        name: "Support Admin",
        permissions: ["users", "scanners"]
      }
    ];

    for (const admin of admins) {
      const existing = await Admin.findOne({ adminId: admin.adminId });

      if (!existing) {
        await Admin.create(admin);
        console.log(`✅ Created: ${admin.adminId}`);
      } else {
        console.log(`⚠️ Already exists: ${admin.adminId}`);
      }
    }

    console.log("✅ Admin seeding complete");
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
};

seedAdmins();