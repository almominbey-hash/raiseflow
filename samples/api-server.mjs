import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { parseEthAmount } from './amount.mjs';

const MAX_BYTES = 8192;
class RequestError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
async function readJson(request) {
  if (request.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
    throw new RequestError(415, 'Content-Type must be application/json.');
  }
  let bytes = 0;
  const chunks = [];
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > MAX_BYTES) throw new RequestError(413, 'Request body is too large.');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new RequestError(400, 'Malformed JSON.'); }
}
function reply(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(body));
}

/** A read-only validation API: no payments, accounts, writes, or wallet signatures. */
export function createApiServer() {
  return http.createServer(async (request, response) => {
    try {
      const path = new URL(request.url, 'http://localhost').pathname;
      if (path === '/api/health' && request.method === 'GET') {
        return reply(response, 200, { status: 'ok' });
      }
      if (path !== '/api/contributions/preview') return reply(response, 404, { error: 'Not found.' });
      if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        return reply(response, 405, { error: 'Use POST.' });
      }
      const body = await readJson(request);
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new RequestError(400, 'Expected a JSON object.');
      }
      if (Object.keys(body).some(key => !['campaignId', 'amount'].includes(key))) {
        throw new RequestError(400, 'Unexpected request fields.');
      }
      if (typeof body.campaignId !== 'string' || !/^(0|[1-9]\d{0,19})$/.test(body.campaignId)) {
        throw new RequestError(400, 'Invalid campaign ID.');
      }
      let wei;
      try { wei = parseEthAmount(body.amount); }
      catch (error) { throw new RequestError(400, error.message); }
      return reply(response, 200, {
        campaignId: body.campaignId, amountWei: wei.toString(), chainId: 11155111,
        previewOnly: true,
      });
    } catch (error) {
      if (!response.destroyed && !response.headersSent) {
        reply(response, error instanceof RequestError ? error.status : 500, {
          error: error instanceof RequestError ? error.message : 'Unable to process request.',
        });
      }
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 3001);
  createApiServer().listen(port, '127.0.0.1', () => console.log(`API sample: http://127.0.0.1:${port}`));
}
