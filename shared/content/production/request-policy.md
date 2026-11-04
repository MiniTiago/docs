## Set timeouts and bound concurrency

Set an HTTP timeout for each operation and limit concurrent requests across workers. See [Configuration](/guides/configuration) for client options.

## Retry reads deliberately

Retry transient read failures with a maximum attempt count or deadline, exponential backoff and jitter. Respect server retry guidance. Correct invalid parameters, permissions and signatures before retrying.
