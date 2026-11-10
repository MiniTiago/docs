import { SpotClient } from '@siebly/kraken-api';

function requiredEnvVar(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Set ${name}.`);
  }
  return value;
}

const client = new SpotClient({
  apiKey: requiredEnvVar('KRAKEN_API_KEY'),
  apiSecret: requiredEnvVar('KRAKEN_API_SECRET'),
});

export { client };
