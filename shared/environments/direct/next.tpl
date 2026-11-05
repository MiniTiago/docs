import { @@REST_CLIENT@@ } from '@@PACKAGE@@';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
@@REQUEST@@

    if (!price) {
      throw new Error('No price was returned.');
    }

    return Response.json({
      symbol: '@@SYMBOL@@',
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
