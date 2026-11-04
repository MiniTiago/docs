## Test coverage {#scope-of-the-live-checks}

Live checks cover package imports, a public REST price request, a market-data WebSocket update and client cleanup. Node.js, Bun and Deno also check CommonJS, TypeScript and process exit.

Results apply to the recorded package, runtime, date and network. Region or browser restrictions can prevent exchange access. Authentication, signing, orders and failure recovery are outside these checks.
