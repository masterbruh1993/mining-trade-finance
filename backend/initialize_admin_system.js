require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const initializeAdminSystem = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    console.log('\n🚀 INITIALIZING ADMIN SYSTEM...');
    console.log('===============================');

    // Check if admin user exists
    let admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('❌ Admin user not found. Creating admin user...');
      
      // Create admin user with default credentials
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin123!', salt);
      
      admin = await User.create({
        username: 'admin',
        email: 'admin@1uptrade.com',
        password: hashedPassword,
        role: 'admin',
        walletBalance: 100000000, // ₱100,000,000
        isVerified: true,
        mobile: '+639123456789'
      });
      
      console.log('✅ Admin user created successfully!');
    } else {
      console.log('✅ Admin user found:', admin.email);
    }

    // Initialize/Update admin wallet balance
    const targetBalance = 100000000; // ₱100,000,000
    
    if (admin.walletBalance === undefined || admin.walletBalance === null || admin.walletBalance < targetBalance) {
      console.log(`\n💰 Updating admin wallet balance...`);
      console.log(`   Current balance: ₱${admin.walletBalance || 0}`);
      
      await User.findByIdAndUpdate(admin._id, { 
        walletBalance: targetBalance 
      }, { runValidators: false });
      
      // Refresh admin object
      admin = await User.findById(admin._id);
      
      console.log(`   New balance: ₱${admin.walletBalance}`);
      console.log('✅ Admin wallet balance updated successfully!');
    } else {
      console.log(`\n💰 Admin wallet balance is sufficient: ₱${admin.walletBalance}`);
    }

    console.log('\n=== ADMIN SYSTEM SUMMARY ===');
    console.log(`Username: ${admin.username}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log(`Wallet Balance: ₱${admin.walletBalance}`);
    console.log(`Verified: ${admin.isVerified}`);
    console.log('\n🎉 Admin system initialization completed successfully!');

  } catch (error) {
    console.error('❌ Error initializing admin system:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

// Run the initialization
initializeAdminSystem();