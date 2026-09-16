const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const app = require('../app');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  if (!server) return;
  await new Promise((resolve) => server.close(resolve));
});

test('OpenAPI JSON documents the active API surface', async () => {
  const response = await fetch(`${baseUrl}/api-docs.json`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') || '', /application\/json/);

  const document = await response.json();
  assert.equal(document.openapi, '3.0.3');
  assert.equal(document.info.title, 'RentVerse API');
  assert.ok(document.paths['/api/health']);
  assert.ok(document.paths['/api/v1/contracts/health']);
  assert.ok(document.paths['/api/v1/contracts/real-estate']);
  assert.ok(document.paths['/api/v1/contracts/real-estate/tokens/{tokenId}']);
  assert.ok(document.paths['/api/v1/contracts/escrow/{tokenId}']);
  assert.ok(document.paths['/api/v1/contracts/real-estate/mint/transaction']);
  assert.ok(document.paths['/api/v1/contracts/escrow/{tokenId}/deposit/transaction']);
  assert.ok(document.paths['/api/v1/contracts/escrow/{tokenId}/approve/transaction']);
});

test('Swagger UI is served for interactive API review', async () => {
  const response = await fetch(`${baseUrl}/api-docs/`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') || '', /text\/html/);

  const html = await response.text();
  assert.match(html, /<title>RentVerse API Documentation<\/title>/i);
  assert.match(html, /id="swagger-ui"/i);
  assert.match(html, /swagger-ui-bundle\.js/i);
});

test('/docs redirects to Swagger UI', async () => {
  const response = await fetch(`${baseUrl}/docs`, { redirect: 'manual' });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), '/api-docs/');
});
