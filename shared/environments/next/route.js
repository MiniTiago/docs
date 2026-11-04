import { readPrice } from '../../../price.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return Response.json({ symbol: 'BTC', price: await readPrice() });
  } catch (error) {
    console.error('BTC price request failed:', error.message || String(error));
    return Response.json({ error: 'Exchange price request failed. Check the server network and logs.' }, { status: 502 });
  }
}
