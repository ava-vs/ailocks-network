import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
  const { ELEVENLABS_API_KEY, PUBLIC_AGENT_ID } = process.env;

  if (!ELEVENLABS_API_KEY || !PUBLIC_AGENT_ID) {
    return new Response(JSON.stringify({ error: 'Missing environment variables' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const apiUrl = `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${PUBLIC_AGENT_ID}`;
    
    console.log(`Fetching signed URL for agent: ${PUBLIC_AGENT_ID}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get signed URL from ElevenLabs:', errorText);
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify({ signedUrl: data.signed_url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-elevenlabs-signed-url function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}; 