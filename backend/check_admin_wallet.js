const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkAdminWallet() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find admin user
    const admin = await User.findOne({ email: 'admin@1uptrade.com' });
    
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('\n📊 Admin Wallet Status:');
    console.log('========================');
    console.log(`Admin Email: ${admin.email}`);
    console.log(`Admin Role: ${admin.role}`);
    console.log(`Wallet Balance: ₱${admin.walletBalance?.toLocaleString() || 'undefined'}`);
    
    if (admin.walletBalance >= 100000000) {
      console.log('✅ Admin wallet balance is properly initialized (₱100,000,000+)');
    } else {
      console.log('⚠️  Admin wallet balance is below expected amount (₱100,000,000)');
    }
    
  } catch (error) {
    console.error('❌ Error checking admin wallet:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkAdminWallet();