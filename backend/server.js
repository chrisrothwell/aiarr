const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const axios = require('axios');require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Store conversation history
const conversationHistory = new Map();

// Helper function to get or initialize conversation history
function getConversationHistory(conversationId) {
  if (!conversationHistory.has(conversationId)) {
    conversationHistory.set(conversationId, []);
  }
  return conversationHistory.get(conversationId);
}

// Helper function to update conversation history
function updateConversationHistory(conversationId, role, content) {
  const history = getConversationHistory(conversationId);
  history.push({ role, content });
  // Keep only the last 10 messages to prevent memory issues
  if (history.length > 10) {
    history.shift();
  }
}

// Helper function to normalize OpenAI tools response
function normalizeOpenAIToolsResponse(messageResponse) {
  console.log('Raw arguments:', messageResponse.tool_calls[0].function.arguments);
  const args = JSON.parse(messageResponse.tool_calls[0].function.arguments);
  console.log('Parsed arguments:', args);
  
  // If parameters are nested under a parameters key, use those
  const parameters = args.parameters || args;
  
  return {
    capability: args.capability,
    action: args.action,
    parameters: parameters
  };
}

// Get MCP capabilities
async function getMCPCapabilities() {
  const response = await fetch(`http://localhost:${process.env.MCP_PORT}/api/capabilities`);
  return response.json();
}

// Execute MCP action
async function executeMCPAction(capability, action, parameters) {
  const response = await fetch(`http://localhost:${process.env.MCP_PORT}/api/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ capability, action, parameters }),
  });
  return response.json();
}

// Routes
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const conversationId = req.body.conversationId || 'default';
    
    // Get MCP capabilities to provide context to OpenAI
    const capabilities = await getMCPCapabilities();
    
    const messages = [
      {
        role: "system",
        content: `You are a helpful assistant for managing a media server called Plexorcist. You can help users with Overseerr requests and Sonarr media management.
        
Available capabilities:
${JSON.stringify(capabilities, null, 2)}

When a user asks about media requests or content, use the appropriate MCP action to get the information.`
      },
      ...getConversationHistory(conversationId),
      {
        role: "user",
        content: message
      }
    ];

    console.log('User message:', message);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      tools: [
        {
          type: "function",
          function: {
            name: "execute_mcp_action",
            description: "Execute an action on the MCP server",
            parameters: {
              type: "object",
              properties: {
                capability: {
                  type: "string",
                  description: "The capability to use"
                },
                action: {
                  type: "string",
                  description: "The action to execute"
                },
                parameters: {
                  type: "object",
                  description: "Parameters for the action"
                }
              },
              required: ["capability", "action"]
            }
          }
        }
      ],
      tool_choice: "auto"
    });

    const messageResponse = response.choices[0].message;
    console.log('OpenAI Response:', messageResponse);
    
    if (messageResponse.tool_calls) {
      console.log('Executing tool: ', messageResponse.tool_calls[0].function)
      const { capability, action, parameters } = await normalizeOpenAIToolsResponse(messageResponse);
      console.log('Executing MCP action:', capability, action, parameters);
      const result = await executeMCPAction(capability, action, parameters);
      
      // Add user message to history
      updateConversationHistory(conversationId, 'user', message);

      // Add assistant's tool response to history
      updateConversationHistory(conversationId, 'assistant', JSON.stringify(result));

      const followUpMessages = [
        {
          role: "system",
          content: "You are a helpful assistant for managing a media server. You can help users with Overseerr requests and Sonarr media management."
        },
        ...getConversationHistory(conversationId),
        { 
          role: "assistant", 
          content: messageResponse.content || "I'll help you with that.",
          tool_calls: [{
            id: messageResponse.tool_calls[0].id,
            type: "function",
            function: {
              name: "execute_mcp_action",
              arguments: messageResponse.tool_calls[0].function.arguments
            }
          }]
        },
        { 
          role: "tool", 
          tool_call_id: messageResponse.tool_calls[0].id,
          content: JSON.stringify(result)
        }
      ];

      console.log('Generated request:', followUpMessages);

      // Get follow-up response from OpenAI
      const followUpResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: followUpMessages,
        tools: [
          {
            type: "function",
            function: {
              name: "execute_mcp_action",
              description: "Execute an action on the MCP server",
              parameters: {
                type: "object",
                properties: {
                  capability: {
                    type: "string",
                    description: "The capability to use"
                  },
                  action: {
                    type: "string",
                    description: "The action to execute"
                  },
                  parameters: {
                    type: "object",
                    description: "Parameters for the action"
                  }
                },
                required: ["capability", "action"]
              }
            }
          }
        ]
      });

      console.log('Follow-up response:', followUpResponse.choices[0].message);

      // Add OpenAI's response to history
      updateConversationHistory(conversationId, 'assistant', followUpResponse.choices[0].message.content);

      res.json({
        result,
        response: followUpResponse.choices[0].message.content
      });
    } else {
      res.json({ response: messageResponse.content });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 