const cron = require('node-cron');
const { checkPricesAndSendAlerts } = require('../services/priceAlertService');

// Run every 12 hours
const schedulePriceChecks = () => {
  cron.schedule('0 */12 * * *', async () => {
    console.log('Running price alert check...');
    try {
      await checkPricesAndSendAlerts();
      console.log('Price alert check completed successfully');
    } catch (error) {
      console.error('Error in price alert cron job:', error);
    }
  });
};

module.exports = {
  schedulePriceChecks
}; 