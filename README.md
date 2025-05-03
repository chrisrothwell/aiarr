# AIARR - AI-Powered Media Server Assistant

AIARR is a chatbot interface that allows users to interact with their media server (Overseerr and Sonarr) using natural language. The application uses OpenAI's GPT model to understand user queries and provides relevant information about media requests and content.

## Features

- ChatGPT-like interface for natural language interaction
- Integration with Overseerr for request management
- Integration with Sonarr for media management
- Real-time chat responses
- Modern UI with Tailwind CSS

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key
- Overseerr instance
- Sonarr instance

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd aiarr
```

2. Install dependencies:
```bash
npm run install-all
```

3. Create a `.env` file in the root directory with the following variables:
```
OPENAI_API_KEY=your_openai_api_key_here
OVERSEERR_API_KEY=your_overseerr_api_key_here
OVERSEERR_URL=http://localhost:5055
SONARR_API_KEY=your_sonarr_api_key_here
SONARR_URL=http://localhost:8989
PORT=3001
```

4. Start the development servers:
```bash
npm run dev
```

This will start both the backend server and the frontend development server.

## Project Structure

- `backend/` - Contains the Express server and MCP server
  - `server.js` - Main server with OpenAI integration
  - `mcp-server.js` - Model Context Protocol server for Overseerr and Sonarr
- `frontend/` - React application
  - `src/components/` - React components
  - `src/App.tsx` - Main application component

## API Endpoints

### Backend Server (Port 3001)
- `POST /api/chat` - Send chat messages to OpenAI

### MCP Server (Port 3002)
- `GET /api/requests` - Get Overseerr requests
- `GET /api/series` - Get Sonarr series

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 