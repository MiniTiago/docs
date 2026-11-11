---
title: "Coinbase order management"
description: "Preview Advanced Trade orders and understand submission, status and cancellation."
---

# Order management

Use authenticated Advanced Trade requests to read balances, prepare orders, submit them deliberately and manage their lifecycle. Private WebSocket updates keep order state current after submission. The runnable order example previews only; the submission and cancellation steps explain live operations.

## Check account access and balances

Configure [Advanced Trade credentials](/guides/authentication) and call `getApiKeyPermissions()` to inspect access. Use `getAccounts()` to read accounts and their available and held balances, following `cursor` while `has_next` is true. Each account has its own UUID; use `getAccount({ account_id })` for a targeted read. A balance is not itself proof that an order meets current product, permission or margin requirements.

<<< @/../examples/account-state.ts

## 1. Prepare and preview {#preview}

Read current product increments, minimums and trading restrictions. Keep amounts as decimal strings. Save this as `preview-order.ts` alongside the [credential module](/guides/authentication), then use that guide's compile and run commands:

<<< @/../examples/preview-order.ts

The example previews a market buy with a USD quote size of `10`. This is an illustrative amount, not a recommendation or a guarantee that the order meets current minimums. Inspect `errs`, `warning`, commissions and totals. A successful preview does not reserve funds or guarantee later execution.

## 2. Submit deliberately {#submit}

For a real order, call [`submitOrder()`](/api/classes/CBAdvancedTradeClient#submitorder) with the reviewed `product_id`, `side` and `order_configuration`, plus `preview_id` when using the preview result. This sends a **live trading request** with the default mainnet client.

Generate a client order ID with `client.generateNewOrderId()` and persist it before submission. Keep the exchange's returned `order_id` and `client_order_id` for recovery. Inspect `success`: a resolved HTTP request can contain `success: false` and `error_response`. With success, read `success_response` and save its identifiers.

Connect and confirm the [private user stream](/guides/private-streams) before submitting. Use subsequent order events to track fills and terminal states; do not query REST simply because submission returned.

### Application functions

These functions are building blocks, not a script that trades when started. Call them only after reviewing the live action. Generate and persist the client order ID before passing the request to `submitReviewedOrder()`. Handle rejected promises at your application's boundary; a transport failure may leave the result unknown.

<<< @/../examples/manage-orders.ts

## 3. Check an unresolved outcome {#check-order}

Use [`getOrder({ order_id })`](/api/classes/CBAdvancedTradeClient#getorder) when the response or stream leaves a specific order unresolved. `getOrders()` and `getFills()` help reconcile gaps or discover the matching order when no exchange ID was received. Match saved client ID, product and request context, and follow pagination.

A request timeout is an unknown outcome. Do not submit a new order with a new ID simply because the first reply was lost. Resolve the original request before deciding whether another order is needed.

## 4. Cancel when needed {#cancel}

[`cancelOrders({ order_ids: [...] })`](/api/classes/CBAdvancedTradeClient#cancelorders) initiates cancellation for up to 100 IDs per request. Inspect every item in `results`: each has its own `success` and `failure_reason`. A successful cancellation request does not rule out a fill racing with cancellation. Continue applying private order events and reconcile through REST only if the final state remains unclear.

`updateOrderPreview()` previews an edit; `updateOrder()` changes the live order. Changes can affect queue priority. Refer to the method and exchange rules before enabling amendments.

[Production usage](/guides/production) · [Errors](/guides/errors)
