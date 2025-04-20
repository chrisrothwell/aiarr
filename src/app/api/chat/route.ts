import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import axios from 'axios';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a helpful assistant that helps users find and request movies and TV shows through Overseerr and Sonarr. 
You can search for content and make requests on behalf of the user. 
When searching, you should look for both movies and TV shows.
When a user wants to request something, you should first search for it and then make the request if found.
Always be concise and helpful in your responses.`;

export async function POST(request: Request) {
  try {
    const { message, messages } = await request.json();

    // First, get the AI's response
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: "user", content: message },
      ],
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content;

    // If the AI suggests searching or requesting content, perform those actions
    if (aiResponse.toLowerCase().includes('search') || aiResponse.toLowerCase().includes('find')) {
      // Extract search terms from the AI's response
      const searchTerms = message.split(' ').filter(word => 
        !['search', 'find', 'for', 'a', 'the', 'an', 'in'].includes(word.toLowerCase())
      ).join(' ');

      if (searchTerms) {
        // Search Overseerr
        const overseerrResponse = await axios.get(`${process.env.OVERSEERR_URL}/api/v1/search`, {
          params: {
            query: encodeURIComponent(searchTerms),
            page: 1,
          },
          headers: {
            'X-Api-Key': process.env.OVERSEERR_API_KEY,
          },
        });

        // Search Sonarr
        const sonarrResponse = await axios.get(`${process.env.SONARR_URL}/api/v3/series/lookup`, {
          params: {
            term: encodeURIComponent(searchTerms),
          },
          headers: {
            'X-Api-Key': process.env.SONARR_API_KEY,
          },
        });

        // Format results
        const results = [
          ...(overseerrResponse.data.results || []).map((item: any) => ({
            id: item.id,
            title: item.title || item.name,
            year: item.releaseDate?.split('-')[0] || item.firstAirDate?.split('-')[0],
            type: item.mediaType,
          })),
          ...(sonarrResponse.data || []).map((item: any) => ({
            id: item.tvdbId,
            title: item.title,
            year: item.year,
            type: 'tv',
          })),
        ];

        if (results.length > 0) {
          const formattedResults = results
            .map(item => `${item.title} (${item.year})`)
            .join('\n');
          
          return NextResponse.json({
            response: `${aiResponse}\n\nI found these results:\n${formattedResults}\n\nWould you like me to request any of these?`
          });
        }
      }
    }

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
} 