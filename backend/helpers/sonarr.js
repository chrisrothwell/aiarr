const axios = require('axios');
require('dotenv').config();

/**
 * Helper function to interact with Sonarr API
 * @param {string} endpoint - The API endpoint to call
 * @param {object} params - Optional query parameters
 * @returns {Promise<object>} - Transformed Sonarr data
 */

async function getSonarrData(endpoint) {
   console.log('Calling Sonarr API:', endpoint);
   try {   
    const response = await axios.get(`${process.env.SONARR_URL}/api/v3/${endpoint}`, {
      headers: {
        'X-Api-Key': process.env.SONARR_API_KEY
      }
    });

    // Transform the response to only include relevant data
    const data = response.data;
    const formattedData = data.map(series => ({
        id: series.id,
        title: series.title
      }));
    console.log(formattedData)
    return formattedData;
  } catch (error) {
    console.error('Sonarr API Error:', error.message);
    throw new Error(`Failed to fetch data from Sonarr: ${error.message}`);
  }
}

module.exports = {
  getSonarrData
}; 