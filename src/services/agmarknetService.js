const axios = require('axios');
const config = require('../config/config');
const CropPrice = require('../models/CropPrice');

class AgmarknetService {
  constructor() {
    this.baseUrl = config.agmarknetApiUrl;
    this.apiKey = config.agmarknetApiKey;
  }

  async fetchCropPrices(params) {
    try {
      const response = await axios.get(`${this.baseUrl}/prices`, {
        params: {
          ...params,
          apiKey: this.apiKey
        }
      });

      // Transform and store the data
      const cropPrices = response.data.map(price => ({
        cropName: price.commodity,
        state: price.state,
        market: price.market,
        price: parseFloat(price.price),
        unit: price.unit,
        date: new Date(price.date),
        source: 'agmarknet'
      }));

      // Bulk upsert to avoid duplicates
      await CropPrice.bulkWrite(
        cropPrices.map(price => ({
          updateOne: {
            filter: {
              cropName: price.cropName,
              state: price.state,
              market: price.market,
              date: price.date
            },
            update: price,
            upsert: true
          }
        }))
      );

      return cropPrices;
    } catch (error) {
      console.error('Agmarknet API error:', error);
      throw new Error('Failed to fetch crop prices from Agmarknet');
    }
  }

  async getCropPrices(filters) {
    try {
      const query = {};

      if (filters.cropName) {
        query.cropName = new RegExp(filters.cropName, 'i');
      }

      if (filters.state) {
        query.state = new RegExp(filters.state, 'i');
      }

      if (filters.market) {
        query.market = new RegExp(filters.market, 'i');
      }

      if (filters.startDate && filters.endDate) {
        query.date = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      } else if (filters.startDate) {
        query.date = { $gte: new Date(filters.startDate) };
      } else if (filters.endDate) {
        query.date = { $lte: new Date(filters.endDate) };
      }

      const cropPrices = await CropPrice.find(query)
        .sort({ date: -1 })
        .limit(filters.limit || 100);

      return cropPrices;
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error('Failed to fetch crop prices from database');
    }
  }
}

module.exports = new AgmarknetService(); 