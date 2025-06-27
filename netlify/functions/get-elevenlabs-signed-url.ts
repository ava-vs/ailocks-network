import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
  // Log all available environment variables for debugging
  console.log("Available environment variables:", Object.keys(process.env));
  
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  const PUBLIC_AGENT_ID = process.env.PUBLIC_AGENT_ID;

  console.log(`Retrieved ELEVENLABS_API_KEY: ${ELEVENLABS_API_KEY ? 'found' : 'NOT FOUND'}`);
  console.log(`Retrieved PUBLIC_AGENT_ID: ${PUBLIC_AGENT_ID ? 'found' : 'NOT FOUND'}`);

  if (!ELEVENLABS_API_KEY) {
    console.error("Missing ELEVENLABS_API_KEY environment variable");
    return new Response(JSON.stringify({ error: "Server configuration error: Missing API Key. Check your .env file and Netlify settings." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  if (!PUBLIC_AGENT_ID) {
    console.error("Missing PUBLIC_AGENT_ID environment variable");
    return new Response(JSON.stringify({ error: "Server configuration error: Missing Agent ID. Check your .env file and Netlify settings." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
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
      console.error(`ElevenLabs API responded with ${response.status}:`, errorText);
      return new Response(JSON.stringify({ error: `Failed to get signed URL from ElevenLabs. Status: ${response.status}`, details: errorText }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    if (!data.signed_url) {
        console.error("ElevenLabs response did not contain a signed_url:", data);
        return new Response(JSON.stringify({ error: "Invalid response from ElevenLabs API" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ signedUrl: data.signed_url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-elevenlabs-signed-url function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: `Internal server error: ${errorMessage}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}; 