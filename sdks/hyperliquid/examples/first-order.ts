import { randomBytes } from 'node:crypto';
import { open, readFile } from 'node:fs/promises';
import { RestClient } from '@siebly/hyperliquid-api';
import { Wallet } from 'ethers';

const receiptFile = 'hyperliquid-testnet-order.json';
class InputError extends Error {}

function decimal(value: string | undefined, label: string) {
  if (!value || value.length > 40 || !/^(0|[1-9]\d*)(\.\d+)?$/.test(value)) {
    throw new InputError(`${label} must be a positive decimal string.`);
  }
  const [whole, rawFraction = ''] = value.split('.');
  const fraction = rawFraction.replace(/0+$/, '');
  const units = BigInt(whole + fraction);
  if (units === 0n) throw new InputError(`${label} must be greater than zero.`);
  return { text: whole + (fraction ? `.${fraction}` : ''), units,
    scale: 10n ** BigInt(fraction.length), decimals: fraction.length,
    significant: (whole + fraction).replace(/^0+/, '').length };
}

async function main() {
  const action = process.argv[2];
  if (!['place', 'status', 'cancel'].includes(action)) {
    throw new InputError('Usage: orders.mts place|status|cancel');
  }
  const accountAddress = process.env.HYPERLIQUID_ACCOUNT_ADDRESS;
  if (!accountAddress || !/^0x[\da-fA-F]{40}$/.test(accountAddress)) {
    throw new InputError('Set HYPERLIQUID_ACCOUNT_ADDRESS to the managed account address.');
  }
  const privateKey = process.env.HYPERLIQUID_PRIVATE_KEY;
  if (action !== 'status') {
    if (process.env.HYPERLIQUID_ALLOW_TESTNET_ORDER !== 'YES') {
      throw new InputError('Set HYPERLIQUID_ALLOW_TESTNET_ORDER=YES to place or cancel this Testnet order.');
    }
    if (!privateKey || !/^0x[\da-fA-F]{64}$/.test(privateKey)) {
      throw new InputError('Set HYPERLIQUID_PRIVATE_KEY to an authorized Testnet API wallet key.');
    }
  }
  const client = new RestClient({ testnet: true, accountAddress,
    ...(action === 'status' ? {} : { privateKey }) }, { timeout: 10_000 });

  if (action !== 'status') {
    const signerAddress = new Wallet(privateKey!).address;
    const role = await client.getUserRole({ user: signerAddress });
    if (role.role !== 'agent' || role.data.user.toLowerCase() !== accountAddress.toLowerCase() ||
        signerAddress.toLowerCase() === accountAddress.toLowerCase()) {
      throw new InputError('Use an API wallet authorized for this Testnet account, not the main account key.');
    }
  }

  if (action === 'place') {
    const size = decimal(process.env.HYPERLIQUID_ORDER_SIZE, 'HYPERLIQUID_ORDER_SIZE');
    const price = decimal(process.env.HYPERLIQUID_LIMIT_PRICE, 'HYPERLIQUID_LIMIT_PRICE');
    const cap = decimal(process.env.HYPERLIQUID_MAX_NOTIONAL, 'HYPERLIQUID_MAX_NOTIONAL');
    if (price.units * size.units * cap.scale > cap.units * price.scale * size.scale) {
      throw new InputError('Order notional exceeds HYPERLIQUID_MAX_NOTIONAL.');
    }
    const metadata = await client.getPerpMetadata();
    const asset = metadata.universe.find((entry) => entry.name === 'BTC');
    if (!asset || asset.isDelisted) throw new InputError('BTC is unavailable on Testnet.');
    if (size.decimals > asset.szDecimals) throw new InputError('Size exceeds the BTC szDecimals limit.');
    if (price.decimals && (price.decimals > 6 - asset.szDecimals || price.significant > 5)) {
      throw new InputError('Price exceeds the BTC decimal or significant-figure limit.');
    }
    const book = await client.getOrderBook({ coin: 'BTC' });
    const bid = decimal(book?.levels[0][0]?.px, 'Best bid');
    if (price.units * bid.scale >= bid.units * price.scale) {
      throw new InputError('Choose a limit price below the current BTC best bid.');
    }

    const cloid = `0x${randomBytes(16).toString('hex')}`;
    const receipt = { network: 'testnet', coin: 'BTC', accountAddress, cloid,
      side: 'buy', size: size.text, price: price.text };
    // Exclusive creation prevents a rerun from silently placing a second order.
    const file = await open(receiptFile, 'wx', 0o600);
    try { await file.writeFile(JSON.stringify(receipt, null, 2) + '\n'); await file.sync(); }
    finally { await file.close(); }
    console.log('Saved client order ID:', cloid);

    const result = await client.submitLimitOrder({ symbol: 'BTC', side: 'buy',
      size: size.text, price: price.text, postOnly: true, clientOrderId: cloid });
    if (result.status !== 'ok') throw new InputError('Order rejected. Keep the receipt and check status.');
    const status = result.response.data.statuses[0];
    if (!status || 'error' in status) throw new InputError('Order rejected. Keep the receipt and check status.');
    console.log('Order result:', 'resting' in status ? 'resting' : 'filled');
    console.log('Run status, then cancel to remove any remaining open quantity.');
    return;
  }

  const receipt = JSON.parse(await readFile(receiptFile, 'utf8'));
  if (receipt.network !== 'testnet' || receipt.coin !== 'BTC' ||
      receipt.accountAddress?.toLowerCase() !== accountAddress.toLowerCase() ||
      !/^0x[\da-f]{32}$/.test(receipt.cloid)) {
    throw new InputError('Receipt does not match this Testnet account.');
  }
  const status = await client.getOrderStatus({ oid: receipt.cloid });
  if (status.status === 'unknownOid') {
    console.log('Order not found. Keep the receipt and check order and fill history before placing another order.');
    process.exitCode = 1;
    return;
  }
  console.log('Order ID:', status.order.order.oid, 'Status:', status.order.status);
  if (action === 'status') return;
  if (status.order.status !== 'open') {
    console.log('Order is no longer open; nothing to cancel.');
    return;
  }
  const result = await client.cancelOrdersByClientOrderId({
    cancels: [{ asset: 'BTC', cloid: receipt.cloid }],
  });
  if (result.status !== 'ok' || result.response.data.statuses[0] !== 'success') {
    throw new InputError('Cancellation was not confirmed. Run status; the order may already have filled.');
  }
  console.log('Cancellation accepted. Run status to confirm the final order state.');
}

main().catch((error: unknown) => {
  console.error(error instanceof InputError ? error.message
    : 'Request failed. If the receipt exists, run status before any further order action.');
  process.exitCode = 1;
});
