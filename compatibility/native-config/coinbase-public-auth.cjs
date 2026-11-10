// This consumer is for public data only. Keep API credentials on your server.
function signJWT() {
  throw new Error('JWT signing is server-only in this public market-data starter.');
}
module.exports = { signJWT, signWSJWT: signJWT };
