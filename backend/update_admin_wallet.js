require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const updateAdminWallet = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log(`\n=== CURRENT ADMIN WALLET ===`);
    console.log(`Admin: ${admin.username} (${admin.email})`);
    console.log(`Current wallet balance: $${admin.walletBalance}`);

    // Update admin wallet to have sufficient balance
    const newBalance = 100000; // $100,000
    
    // Update wallet directly in database to bypass validation
    await User.findByIdAndUpdate(admin._id, { walletBalance: newBalance }, { runValidators: false });
    
    // Fetch updated admin to confirm
    const updatedAdmin = await User.findById(admin._id);

    console.log(`\n✅ Admin wallet updated successfully!`);
    console.log(`New wallet balance: $${updatedAdmin.walletBalance}`);

  } catch (error) {
    console.error('❌ Error updating admin wallet:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

updateAdminWallet();