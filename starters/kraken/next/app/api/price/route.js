import { SpotClient } from '@siebly/kraken-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = new SpotClient();
    const response = await client.getTicker({ pair: 'XBTUSD' });
    const ticker = Object.values(response.result)[0];
    const price = ticker?.c[0];

    if (!price) {
      throw new Error('No price was returned.');
    }

    return Response.json({
      symbol: 'BTC/USD',
      price: String(price),
    });
  } catch (error) {
    console.error('Price request failed:', error);

    return Response.json(
      { error: 'Exchange price request failed. Check the server logs.' },
      { status: 502 },
    );
  }
}
