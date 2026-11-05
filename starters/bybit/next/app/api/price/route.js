import { RestClientV5 } from 'bybit-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = new RestClientV5();
    const response = await client.getTickers({
      category: 'spot',
      symbol: 'BTCUSDT',
    });

    if (response.retCode !== 0) {
      throw new Error(response.retMsg);
    }

    const price = response.result.list[0]?.lastPrice;

    if (!price) {
      throw new Error('No price was returned.');
    }

    return Response.json({
      symbol: 'BTCUSDT',
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
