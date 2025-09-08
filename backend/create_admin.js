const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./models/User');

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@1uptrade.com' });
    if (existingAdmin) {
      console.log('Admin user already exists, updating password and status...');
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123!', salt);
      
      // Update the admin user
      await User.findByIdAndUpdate(existingAdmin._id, {
        password: hashedPassword,
        status: 'Active'
      });
      
      console.log('Admin user updated successfully');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      console.log('Status: Active');
      process.exit(0);
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123!', salt);

    // Create admin user
    const adminData = {
      username: 'admin',
      email: 'admin@1uptrade.com',
      password: hashedPassword,
      fullName: 'System Administrator',
      mobileNumber: '09123456789',
      role: 'admin',
      status: 'Active'
    };

    const admin = await User.create(adminData);
    console.log('✅ Admin user created successfully!');
    console.log('Email:', admin.email);
    console.log('Username:', admin.username);
    console.log('Role:', admin.role);
    console.log('Password: admin123!');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createAdmin();