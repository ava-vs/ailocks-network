import type { Context } from '@netlify/edge-functions';

export default async (_request: Request, context: Context) => {
  // Default to US location if geo data is unavailable
  const country = context.geo?.country?.code || 'US';
  const city = context.geo?.city || 'New York';
  const timezone = context.geo?.timezone || 'America/New_York';
  const region = context.geo?.subdivision?.code || 'NY';
  
  const locationData = {
    country,
    city,
    timezone,
    region,
    latitude: context.geo?.latitude || 40.7128,
    longitude: context.geo?.longitude || -74.0060,
    isDefault: !context.geo?.country?.code
  };

  // Add location data to response headers
  const response = await context.next();
  response.headers.set('X-User-Location', JSON.stringify(locationData));
  
  return response;
};

export const config = { path: '/*' };