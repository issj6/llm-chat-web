import { kv } from '@vercel/kv';

// Export the Vercel KV client
// In development, make sure you have KV_REST_API_URL and KV_REST_API_TOKEN in .env.local
export const storage = kv;
