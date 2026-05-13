require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./src/models/Admin');

const seedAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const admins = [
      {
        adminId: "987456",
        pin: "369369",
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


// require('dotenv').config();
// const mongoose = require('mongoose');
// const PaymentMethod = require('./src/models/PaymentMethod');

// mongoose.connect(process.env.MONGO_URI)
//   .then(async () => {
//     // Clear existing payment methods
//     await PaymentMethod.deleteMany();

//     // Insert both BEP20 and TRC20
//     await PaymentMethod.insertMany([
//       {
//         method: 'USDT-BEP20',
//         details: {
//           address: '0x40Cf516F5fFe8894b3e6d41b61A0609b6638B74e',
//           network: 'BSC (BEP20)'
//         }
//       },
//       {
//         method: 'USDT-TRC20',
//         details: {
//           address: 'TPLpMLFGQ7MvnUyNdpSuJ5hkeQfkR8izJw',
//           network: 'TRON (TRC20)'
//         }
//       }
//     ]);

//     // console.log("✅ BEP20 and TRC20 payment methods seeded successfully");
//     // console.log("📝 BEP20 Address:", '0xa91D8Ba3029FC14907cb4bEE60763869f0eD88f7');
//     // console.log("📝 TRC20 Address:", 'TGTmCXghBxNAkUxeL7hnDPjQiQicKG26v2');
    
//     process.exit();
//   })
//   .catch(err => {
//     console.error("❌ Error seeding payment methods:", err);
//     process.exit(1);
//   });


// // ================= SEED ADMIN =================
// exports.seedAdmin = async () => {
//   try {
//     // Check for existing 6-digit admin IDs
//     const existingAdmin = await Admin.findOne({ 
//       $or: [
//         { adminId: '777777' },
//         { adminId: '888888' },
//         { adminId: '999999' }
//       ]
//     });
    
//     if (!existingAdmin) {
//       // Create main admin
//       await Admin.create({
//         adminId: '777777',
//         pin: '123456',
//         name: 'Admin',
//         role: 'admin',
//         permissions: ['all']
//       });

//       // Create finance admin
//       await Admin.create({
//         adminId: '888888',
//         pin: '123456',
//         name: 'Finance Admin',
//         role: 'admin',
//         permissions: ['deposits', 'withdrawals']
//       });

//       // Create support admin
//       await Admin.create({
//         adminId: '999999',
//         pin: '123456',
//         name: 'Support Admin',
//         role: 'admin',
//         permissions: ['users', 'scanners']
//       });

//       console.log('━━━━━━━━━━━━━━━━━━━━━━━');
//       console.log('✅ ADMINS SEEDED SUCCESSFULLY!');
//       console.log('━━━━━━━━━━━━━━━━━━━━━━━');
//       console.log('📋 Admin ID: 777777 | PIN: 123456 | Role: Admin');
//       console.log('📋 Admin ID: 888888 | PIN: 123456 | Role: Finance Admin');
//       console.log('📋 Admin ID: 999999 | PIN: 123456 | Role: Support Admin');
//       console.log('━━━━━━━━━━━━━━━━━━━━━━━');
//     } else {
//       console.log('✅ Admins already exist');
      
//       // Show existing admins
//       const admins = await Admin.find().select('-pin');
//       console.log('━━━━━━━━━━━━━━━━━━━━━━━');
//       console.log('📋 Existing Admins:');
//       admins.forEach(admin => {
//         console.log(`   ${admin.adminId} - ${admin.name || 'Admin'} (${admin.role})`);
//       });
//       console.log('━━━━━━━━━━━━━━━━━━━━━━━');
//     }
//   } catch (err) {
//     console.error('❌ Error seeding admin:', err);
//   }
// };