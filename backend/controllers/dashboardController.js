const User = require('../models/User');
const Investment = require('../models/Investment');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');

exports.getDashboard = async (req, res) => {
  try {
    console.log('Dashboard request for user:', req.user?.id);
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      console.log('User not found:', req.user.id);
      return res.status(404).json({ status: "failed", message: "User not found" });
    }

    const contracts = await Investment.find({ userId: user._id });
    
    // Get real-time wallet balances from Wallet model (same as /wallets/balances endpoint)
    const wallets = await Wallet.find({ user: user._id });
    
    // Initialize balances
    let creditWallet = 0;
    let passiveWallet = 0;
    let bonusWallet = 0;
    
    // Map wallet balances from actual Wallet records
    wallets.forEach(wallet => {
      switch (wallet.walletType) {
        case 'credit':
          creditWallet = wallet.balance;
          break;
        case 'passive':
          passiveWallet = wallet.balance;
          break;
        case 'bonus':
          bonusWallet = wallet.balance;
          break;
      }
    });
    
    // Calculate total payouts received (sum of all credited payouts)
    const payoutsResult = await Transaction.aggregate([
      {
        $match: {
          user: user._id,
          type: { $in: ['earning', 'referral'] },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    const totalPayoutsReceived = payoutsResult.length > 0 ? payoutsResult[0].total : 0;
    
    // Calculate encashment total (sum of all completed withdrawals)
    const encashmentResult = await Transaction.aggregate([
      {
        $match: {
          user: user._id,
          type: 'withdrawal',
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    const encashmentTotal = encashmentResult.length > 0 ? encashmentResult[0].total : 0;
    
    console.log('Dashboard data - Balance:', creditWallet, 'Passive:', passiveWallet, 'Bonus:', bonusWallet, 'Total Payouts Received:', totalPayoutsReceived, 'Contracts:', contracts.length);
    
    return res.json({
      status: "success",
      balance: creditWallet,
      passiveWallet: passiveWallet,
      bonusWallet: bonusWallet,
      totalPayoutsReceived: totalPayoutsReceived,
      encashmentTotal: encashmentTotal,
      contracts
    });
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    return res.status(500).json({ status: "failed", message: "Server error" });
  }
};