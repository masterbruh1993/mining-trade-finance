const mongoose = require('mongoose');
const Wallet = require('./models/Wallet');
require('dotenv').config();

const cleanupCashWallets = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all cash wallets
    const cashWallets = await Wallet.find({ walletType: 'cash' });
    console.log(`Found ${cashWallets.length} cash wallets`);

    if (cashWallets.length > 0) {
      // Delete all cash wallets
      const result = await Wallet.deleteMany({ walletType: 'cash' });
      console.log(`Deleted ${result.deletedCount} cash wallets`);
    } else {
      console.log('No cash wallets found to delete');
    }

    // Verify the cleanup
    const remainingCashWallets = await Wallet.find({ walletType: 'cash' });
    console.log(`Remaining cash wallets: ${remainingCashWallets.length}`);

    // Show current wallet types in database
    const allWallets = await Wallet.find({});
    const walletTypes = [...new Set(allWallets.map(w => w.walletType))];
    console.log(`Current wallet types in database: ${walletTypes.join(', ')}`);

    await mongoose.disconnect();
    console.log('Cleanup completed successfully');
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
};

cleanupCashWallets();