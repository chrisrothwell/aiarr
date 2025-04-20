import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
  }

  try {
    // First, search Overseerr
    const overseerrResponse = await axios.get(`${process.env.OVERSEERR_URL}/api/v1/search`, {
      params: {
        query: encodeURIComponent(query),
        page: 1,
      },
      headers: {
        'X-Api-Key': process.env.OVERSEERR_API_KEY,
      },
    });

    // Then, search Sonarr
    const sonarrResponse = await axios.get(`${process.env.SONARR_URL}/api/v3/series/lookup`, {
      params: {
        term: encodeURIComponent(query),
      },
      headers: {
        'X-Api-Key': process.env.SONARR_API_KEY,
      },
    });

    // Combine and format results
    const results = [
      ...(overseerrResponse.data.results || []).map((item: any) => ({
        id: item.id,
        title: item.title || item.name,
        year: item.releaseDate?.split('-')[0] || item.firstAirDate?.split('-')[0],
        type: item.mediaType,
        poster: item.posterPath,
      })),
      ...(sonarrResponse.data || []).map((item: any) => ({
        id: item.tvdbId,
        title: item.title,
        year: item.year,
        type: 'tv',
        poster: item.remotePoster,
      })),
    ];

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
} 