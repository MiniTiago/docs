import type { PreviewAdvTradeOrderRequest } from 'coinbase-api';
import { client } from './authenticated-client.js';

async function main() {
  const request: PreviewAdvTradeOrderRequest = {
    product_id: 'BTC-USD',
    side: 'BUY',
    order_configuration: {
      market_market_ioc: { quote_size: '10' },
    },
  };

  const preview = await client.previewOrder(request);
  console.log(preview);
  if (preview.errs.length > 0) {
    throw new Error(`Preview rejected: ${preview.errs.join(', ')}`);
  }
  console.log('Preview only. No order was submitted.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
