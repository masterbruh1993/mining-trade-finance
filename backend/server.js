const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const SchedulerService = require('./services/schedulerService');
const PayoutService = require('./services/payoutService');

// Route files
const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const withdrawalRoutes = require('./routes/withdrawalRoutes');
const activeContractsRoutes = require('./routes/activeContractsRoutes');
const encashmentRoutes = require('./routes/encashmentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const adminLogRoutes = require('./routes/adminLogRoutes');
const depositsWithdrawalsRoutes = require('./routes/depositsWithdrawalsRoutes');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Create default admin user
const createDefaultAdmin = async () => {
  try {
    const User = require('./models/User');
    const adminExists = await User.findOne({ email: 'admin@1uptrade.com' });
    
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@1uptrade.com',
        password: 'admin123!',
        fullName: 'System Administrator',
        mobileNumber: '1234567890',
        role: 'admin',
        status: 'Active',
        walletBalance: 0
      });
      console.log('Default admin user created successfully');
    }
  } catch (error) {
    console.error('Error creating default admin user:', error.message);
  }
};

// Create default admin after DB connection
setTimeout(createDefaultAdmin, 1000);

// Initialize scheduler service for automated earnings processing
SchedulerService.init();

// Initialize payout service for automated payouts
PayoutService.startPayoutScheduler();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// Serve uploads directory as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/investments', investmentRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/withdrawals', withdrawalRoutes);
app.use('/api/v1/contracts', activeContractsRoutes);
app.use('/api/v1', encashmentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/admin/logs', adminLogRoutes);
app.use('/api/v1/deposits-withdrawals', depositsWithdrawalsRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('1Uptrade-v3 API is running');
});

// Error handler middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  // server.close(() => process.exit(1));
});