## Scope of the live checks

A passing runtime result requires importing the published SDK, receiving a positive BTC price from the real REST API, receiving a real market-data WebSocket update, and closing the client. Node.js, Bun and Deno also check CommonJS, TypeScript and natural process exit. No expected market price is hardcoded.

Checks make public market-data requests only. Authenticated requests, signing accepted by an exchange, order placement, rate-limit recovery, timeout handling, heartbeat recovery and reconnection are **not verified** by these checks. No credentials are supplied, no forced error responses are created and no exchange server is simulated.

Live results apply to the displayed package and runtime at the recorded check time, from this test machine’s network. Exchanges can restrict access by region, network or origin. A blocked connection is recorded as a failed live check rather than replaced with simulated data.
