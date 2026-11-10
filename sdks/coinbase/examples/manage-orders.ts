import type { SubmitAdvTradeOrderRequest } from 'coinbase-api';
import { client } from './authenticated-client.js';

// These functions send live requests only when your application calls them.
// Persist request.client_order_id before calling submitReviewedOrder().
export async function submitReviewedOrder(request: SubmitAdvTradeOrderRequest) {
  const response = await client.submitOrder(request);
  if (!response.success || !response.success_response) {
    throw new Error(`Order rejected: ${JSON.stringify(response.error_response)}`);
  }
  const { order_id, client_order_id } = response.success_response;
  return { order_id, client_order_id };
}

// Use this to resolve a specific gap, not after every healthy stream update.
export async function checkUnresolvedOrder(orderId: string) {
  const { order } = await client.getOrder({ order_id: orderId });
  return order;
}

export async function cancelOrder(orderId: string) {
  const response = await client.cancelOrders({ order_ids: [orderId] });
  return response.results;
}
