import { CBAdvancedTradeClient } from 'coinbase-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = new CBAdvancedTradeClient();
    const ticker = await client.getPublicProduct({ product_id: 'BTC-USD' });
    const price = ticker.price;

    if (!price) {
      throw new Error('No price was returned.');
    }

    return Response.json({
      symbol: 'BTC-USD',
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
