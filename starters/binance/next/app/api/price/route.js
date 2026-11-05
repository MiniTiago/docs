import { MainClient } from 'binance';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = new MainClient();
    const ticker = await client.getSymbolPriceTicker({
      symbol: 'BTCUSDT',
    });

    if (Array.isArray(ticker)) {
      throw new Error('Expected a single-symbol ticker.');
    }

    const price = ticker.price;

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
