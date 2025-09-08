const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkAdminUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const adminUser = await User.findOne({ email: 'admin@1uptrade.com' });
    
    if (adminUser) {
      console.log('Admin user found:');
      console.log('ID:', adminUser._id);
      console.log('Username:', adminUser.username);
      console.log('Email:', adminUser.email);
      console.log('Role:', adminUser.role);
      console.log('Status:', adminUser.status);
      console.log('Password hash exists:', !!adminUser.password);
      console.log('Password hash length:', adminUser.password?.length);
    } else {
      console.log('Admin user not found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAdminUser();