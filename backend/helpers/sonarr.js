const axios = require('axios');
require('dotenv').config();

/**
 * Helper function to interact with Sonarr API
 * @param {string} endpoint - The API endpoint to call
 * @param {object} params - Optional query parameters
 * @returns {Promise<object>} - Transformed Sonarr data
 */

async function getSonarrData(endpoint, params = {}) {
   console.log('Calling Sonarr API:', endpoint, params);
   try {   
    const response = await axios.get(`${process.env.SONARR_URL}/api/v3/${endpoint}`, {
      headers: {
        'X-Api-Key': process.env.SONARR_API_KEY
      },
      params
    });

    // Transform the response to only include relevant data
    const data = response.data;
    if (endpoint === 'series') {
      return data.map(series => ({
        id: series.id,
        title: series.title,
        year: series.year,
        status: series.status,
        monitored: series.monitored,
        qualityProfile: series.qualityProfileId,
        path: series.path
      }));
    } else if (endpoint.startsWith('series/')) {
      return {
        id: data.id,
        title: data.title,
        year: data.year,
        status: data.status,
        monitored: data.monitored,
        qualityProfile: data.qualityProfileId,
        path: data.path,
        seasons: data.seasons.map(season => ({
          seasonNumber: season.seasonNumber,
          monitored: season.monitored,
          statistics: season.statistics
        }))
      };
    }
    return data;
  } catch (error) {
    console.error('Sonarr API Error:', error.message);
    throw new Error(`Failed to fetch data from Sonarr: ${error.message}`);
  }
}

module.exports = {
  getSonarrData
}; 