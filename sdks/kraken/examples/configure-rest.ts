import { SpotClient } from '@siebly/kraken-api';

const client = new SpotClient({}, { timeout: 10000 });

export { client };
