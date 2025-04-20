import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, tmdbId, tvdbId, title } = body;

    if (type === 'movie') {
      // Request movie through Overseerr
      const response = await axios.post(
        `${process.env.OVERSEERR_URL}/api/v1/request`,
        {
          mediaId: tmdbId,
          mediaType: 'movie',
        },
        {
          headers: {
            'X-Api-Key': process.env.OVERSEERR_API_KEY,
          },
        }
      );
      return NextResponse.json(response.data);
    } else if (type === 'tv') {
      // Request TV show through Sonarr
      const response = await axios.post(
        `${process.env.SONARR_URL}/api/v3/series`,
        {
          tvdbId,
          title,
          qualityProfileId: 1, // You might want to make this configurable
          rootFolderPath: process.env.SONARR_ROOT_FOLDER || '/tv',
          addOptions: {
            searchForMissingEpisodes: true,
            searchForCutoffUnmetEpisodes: true,
          },
        },
        {
          headers: {
            'X-Api-Key': process.env.SONARR_API_KEY,
          },
        }
      );
      return NextResponse.json(response.data);
    }

    return NextResponse.json(
      { error: 'Invalid media type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Request error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 