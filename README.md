# AIARR - Media Control Chat

A conversational interface for managing your media with Overseerr and Sonarr using OpenAI's GPT-4.

## Features

- Natural language chat interface powered by OpenAI GPT-4
- Search for movies and TV shows across Overseerr and Sonarr
- Request media through simple conversation
- Modern, responsive UI built with Next.js and Tailwind CSS

## Prerequisites

- Node.js 18.x or later
- npm or yarn
- Running instances of Overseerr and Sonarr
- OpenAI API key

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/aiarr.git
cd aiarr
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory with the following variables:
```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Overseerr Configuration
OVERSEERR_URL=http://localhost:5055
OVERSEERR_API_KEY=your_overseerr_api_key

# Sonarr Configuration
SONARR_URL=http://localhost:8989
SONARR_API_KEY=your_sonarr_api_key

# Next.js Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

Simply type your requests in natural language. For example:
- "Find the movie Inception"
- "Search for TV shows about space"
- "Request the latest season of Stranger Things"

The AI will understand your request, search for the content, and help you make the request if desired.

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key
- `OVERSEERR_URL`: The URL of your Overseerr instance
- `OVERSEERR_API_KEY`: Your Overseerr API key
- `SONARR_URL`: The URL of your Sonarr instance
- `SONARR_API_KEY`: Your Sonarr API key
- `NEXT_PUBLIC_API_URL`: The URL of your Next.js application

## Technologies Used

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- OpenAI GPT-4
- React Query
- Axios

## License

MIT 