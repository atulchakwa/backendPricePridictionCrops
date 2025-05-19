const nodemailer = require('nodemailer');
const { config } = require('../config/config');
const CropPrice = require('../models/CropPrice');
const User = require('../models/User');

// Create email transporter
const transporter = nodemailer.createTransport({
  host: config.email?.host || 'smtp.gmail.com',
  port: config.email?.port || 587,
  secure: config.email?.secure || false,
  auth: {
    user: config.email?.user,
    pass: config.email?.password
  }
});

// Calculate moving average
const calculateMovingAverage = async (cropName, location, market, days) => {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);

  const prices = await CropPrice.find({
    cropName,
    location,
    market,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });

  if (prices.length === 0) return null;

  const sum = prices.reduce((acc, curr) => acc + curr.price, 0);
  return sum / prices.length;
};

// Detect price anomaly
const detectPriceAnomaly = async (currentPrice, cropName, location, market) => {
  // Calculate 7-day and 30-day moving averages
  const ma7 = await calculateMovingAverage(cropName, location, market, 7);
  const ma30 = await calculateMovingAverage(cropName, location, market, 30);

  if (!ma7 || !ma30) return null;

  // Calculate percentage changes
  const change7d = ((currentPrice - ma7) / ma7) * 100;
  const change30d = ((currentPrice - ma30) / ma30) * 100;

  return {
    isAnomaly: Math.abs(change7d) > 20 || Math.abs(change30d) > 20,
    change7d,
    change30d,
    ma7,
    ma30
  };
};

// Send email alert
const sendPriceAlert = async (user, alertData) => {
  // Check if email configuration is complete
  if (!config.email?.user || !config.email?.password) {
    console.warn('Email configuration is incomplete. Skipping alert.');
    return false;
  }

  const { cropName, location, market, currentPrice, change7d, change30d } = alertData;

  const subject = `📉 Price Alert: Abnormal Change in ${cropName}`;
  const html = `
    <h2>Price Alert for ${cropName}</h2>
    <p>We've detected an unusual price change in ${cropName} at ${market}, ${location}.</p>
    <h3>Current Price: ₹${currentPrice}</h3>
    <h3>Price Changes:</h3>
    <ul>
      <li>7-day change: ${change7d.toFixed(2)}%</li>
      <li>30-day change: ${change30d.toFixed(2)}%</li>
    </ul>
    <p>This alert is based on your configured threshold of 20%.</p>
    <p>You can update your alert preferences in your profile settings.</p>
  `;

  try {
    await transporter.sendMail({
      from: config.email?.from || config.email?.user,
      to: user.email,
      subject,
      html
    });

    // Update lastAlertSent timestamp
    await User.findByIdAndUpdate(user._id, {
      lastAlertSent: new Date()
    });

    return true;
  } catch (error) {
    console.error('Error sending price alert email:', error);
    return false;
  }
};

// Main function to check prices and send alerts
const checkPricesAndSendAlerts = async () => {
  try {
    // Get all subscribed users
    const users = await User.find({ subscribedToAlerts: true });

    // Get latest prices for each crop
    const latestPrices = await CropPrice.aggregate([
      {
        $sort: { date: -1 }
      },
      {
        $group: {
          _id: {
            cropName: '$cropName',
            location: '$location',
            market: '$market'
          },
          latestPrice: { $first: '$price' },
          date: { $first: '$date' }
        }
      }
    ]);

    for (const user of users) {
      const { alertPreferences } = user;
      const { crops, locations, priceChangeThreshold } = alertPreferences;

      // Filter prices based on user preferences
      const relevantPrices = latestPrices.filter(price => {
        const matchesCrop = crops.length === 0 || crops.includes(price._id.cropName);
        const matchesLocation = locations.length === 0 || locations.includes(price._id.location);
        return matchesCrop && matchesLocation;
      });

      for (const price of relevantPrices) {
        const anomaly = await detectPriceAnomaly(
          price.latestPrice,
          price._id.cropName,
          price._id.location,
          price._id.market
        );

        if (anomaly && anomaly.isAnomaly) {
          await sendPriceAlert(user, {
            cropName: price._id.cropName,
            location: price._id.location,
            market: price._id.market,
            currentPrice: price.latestPrice,
            change7d: anomaly.change7d,
            change30d: anomaly.change30d
          });
        }
      }
    }
  } catch (error) {
    console.error('Error in checkPricesAndSendAlerts:', error);
  }
};

module.exports = {
  checkPricesAndSendAlerts
}; 