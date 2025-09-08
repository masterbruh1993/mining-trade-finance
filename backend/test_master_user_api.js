require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected to database');
  
  const user = await User.findById('68b9bf1e9b219d5f32a42291');
  if (!user) {
    console.log('Master user not found');
    process.exit(1);
  }
  
  console.log('User found:', user.username, 'ID:', user._id.toString());
  console.log('User bonus wallet in DB:', user.bonusWallet);
  
  const token = jwt.sign({id: user._id.toString()}, process.env.JWT_SECRET, {expiresIn: '1h'});
  console.log('Generated token for master user');
  
  try {
    // Test Dashboard API
    console.log('\n=== Testing Dashboard API ===');
    const dashRes = await axios.get('http://localhost:5000/api/v1/dashboard', {
      headers: {Authorization: `Bearer ${token}`}
    });
    console.log('Dashboard API Response:');
    console.log(JSON.stringify(dashRes.data, null, 2));
    
    // Test Wallet Balances API
    console.log('\n=== Testing Wallet Balances API ===');
    const walletRes = await axios.get('http://localhost:5000/api/v1/wallet/balances', {
      headers: {Authorization: `Bearer ${token}`}
    });
    console.log('Wallet Balances API Response:');
    console.log(JSON.stringify(walletRes.data, null, 2));
    
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
  }
  
  process.exit(0);
}).catch(console.error);