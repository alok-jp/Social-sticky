const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const adminEmail = 'Alokverma1566@gmail.com';
    const adminPassword = 'Alokv@8840';
    
    let admin = await User.findOne({ email: adminEmail });
    
    if (admin) {
      if (admin.role !== 'admin') {
        admin.role = 'admin';
        await admin.save();
        console.log('✅ User promoted to Admin role.');
      }
      return;
    }

    const uid = '#ALOK007'; // Signature UID for Admin
    admin = await User.create({
      name: 'Admin Alok',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      uid,
      statusMessage: 'Built Different. Admin Level. 🗿'
    });

    console.log('👑 Admin user seeded successfully.');
  } catch (err) {
    console.error('❌ Admin seeding failed:', err.message);
  }
};

module.exports = seedAdmin;
