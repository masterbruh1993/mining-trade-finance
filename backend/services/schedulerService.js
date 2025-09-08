const cron = require('node-cron');
const EarningsService = require('./earningsService');

class SchedulerService {
  static init() {
    console.log('Initializing scheduler service...');
    
    // Run daily at midnight to check for due payouts
    cron.schedule('0 0 * * *', async () => {
      console.log('Running daily payout check at midnight...');
      try {
        await EarningsService.processPendingPayouts();
      } catch (error) {
        console.error('Scheduled payout processing failed:', error);
      }
    });

    // TEMPORARILY DISABLED: Run every 5 minutes for testing and immediate processing
    // This was causing MongoDB transaction errors in standalone mode
    // cron.schedule('*/5 * * * *', async () => {
    //   console.log('Running frequent payout check for testing...');
    //   try {
    //     await EarningsService.processPendingPayouts();
    //   } catch (error) {
    //     console.error('Frequent payout processing failed:', error);
    //   }
    // });

    console.log('Scheduler service initialized successfully');
  }

  // Manual trigger for testing
  static async triggerPayouts() {
    console.log('Manually triggering payout processing...');
    try {
      await EarningsService.processPendingPayouts();
      return { success: true, message: 'Payouts processed successfully' };
    } catch (error) {
      console.error('Manual payout processing failed:', error);
      return { success: false, message: error.message };
    }
  }
}

module.exports = SchedulerService;