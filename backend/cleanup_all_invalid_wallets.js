const mongoose = require('mongoose');
const Wallet = require('./models/Wallet');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/1uptrade', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function cleanupInvalidWallets() {
  try {
    console.log('Connected to MongoDB');
    
    // Find and delete all wallets with invalid types
    const invalidTypes = ['cash', 'cash_wallet', 'income_wallet', 'investment_wallet'];
    
    for (const type of invalidTypes) {
      const deletedWallets = await Wallet.deleteMany({ walletType: type });
      console.log(`Deleted ${deletedWallets.deletedCount} wallets with type: ${type}`);
    }
    
    // Verify cleanup - check remaining wallet types
    const remainingWallets = await Wallet.distinct('walletType');
    console.log('Remaining wallet types:', remainingWallets);
    
    // Count total wallets
    const totalWallets = await Wallet.countDocuments();
    console.log('Total wallets remaining:', totalWallets);
    
    console.log('Cleanup completed successfully!');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    mongoose.connection.close();
  }
}

cleanupInvalidWallets();