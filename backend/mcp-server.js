const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const { getSonarrData, getSonarrAvailableSeries, getSonarrAvailableEpisodes } = require('./helpers/sonarr');

// Initialize dotenv
dotenv.config();

// Create Express app
const app = express();
const port = Number(process.env.MCP_PORT) || 3002;

// Middleware
app.use(express.json());

// Define capabilities
const capabilities = {
  'media-requests': {
    description: 'Manage media requests through Overseerr',
    actions: {
      getRequests: {
        description: 'Get all media requests',
        handler: async () => {
          const response = await axios.get(`${process.env.OVERSEERR_URL}/api/v1/request`, {
            headers: {
              'X-Api-Key': process.env.OVERSEERR_API_KEY
            }
          });
          return response.data;
        }
      },
      getMedia: {
        description: 'Get media details by ID',
        parameters: {
          mediaId: { type: 'string', description: 'The ID of the media' }
        },
        handler: async ({ mediaId }) => {
          const response = await axios.get(`${process.env.OVERSEERR_URL}/api/v1/media/${mediaId}`, {
            headers: {
              'X-Api-Key': process.env.OVERSEERR_API_KEY
            }
          });
          return response.data;
        }
      }
    }
  },
  'content-management': {
    description: 'Determine what content is available on the server',
    actions: {
      getSeries: {
        description: 'Get all TV series available on the server',
        handler: async () => {
          return await getSonarrData('series');
        }
      },
      getSeriesById: {
        description: 'Get series details by ID',
        parameters: {
          id: { type: 'string', description: 'The ID of the series' }
        },
        handler: async ({ id }) => {
          return await getSonarrData(`series/${id}`);
        }
      },
      getSonarrAvailableSeries: {
        description: 'Search for series available on the server by name',
        parameters: {
          query: { type: 'string', description: 'The query from the user' }
        },
        handler: async (params) => {
          console.log('getSonarrAvailableSeries handler called with params:', params);
          console.log('Searching for series with query:', params.query);
          return await getSonarrAvailableSeries(params.query);
        }
      },
      getSonarrAvailableEpisodes: {
        description: 'Search for episodes of a series available on the server by local series ID',
        parameters: {
          query: { type: 'string', description: 'The ID of the series on local' }
        },
        handler: async (params) => {
          console.log('getSonarrAvailableEpisodes handler called with params:', params);
          console.log('Searching for episodes with localseriesId:', params.query);
          return await getSonarrAvailableEpisodes(params.query);
        }
      }
    }
  }
};

// MCP Routes
app.get('/api/capabilities', (req, res) => {
  res.json(Object.entries(capabilities).map(([name, capability]) => ({
    name,
    description: capability.description,
    actions: Object.entries(capability.actions).map(([actionName, action]) => ({
      name: actionName,
      description: action.description,
      parameters: action.parameters
    }))
  })));
});

app.post('/api/execute', async (req, res) => {
  console.log('Route /api/execute with req.body = ', req.body)
  try {
    console.log('Route /api/execute with req.body = ', req.body)
    const { capability, action, parameters } = req.body;
    
    if (!capabilities[capability]) {
      throw new Error(`Capability ${capability} not found`);
    }
    
    if (!capabilities[capability].actions[action]) {
      throw new Error(`Action ${action} not found in capability ${capability}`);
    }
    
    console.log('executing action:', action, 'with parameters:', parameters)
    const result = await capabilities[capability].actions[action].handler(parameters);
    res.json(result);
  } catch (error) {
    console.error('Error executing action:', error);
    res.status(500).json({ error: error.message || 'An unknown error occurred' });
  }
});

// Start MCP server
app.listen(port, () => {
  console.log(`MCP Server running on port ${port}`);
  console.log('Available capabilities:', Object.keys(capabilities));
}); 