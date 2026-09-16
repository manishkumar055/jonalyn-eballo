const test = require('node:test');
const assert = require('node:assert/strict');

process.env.BLOCKCHAIN_CHAIN_ID = '11155111';
process.env.BLOCKCHAIN_RPC_URL = 'http://127.0.0.1:8545';
process.env.REAL_ESTATE_CONTRACT_ADDRESS =
  '0x0000000000000000000000000000000000000001';
process.env.ESCROW_CONTRACT_ADDRESS =
  '0x0000000000000000000000000000000000000002';

const service = require('./contractService');

test('buildMintTransaction returns allowlisted calldata without signing', () => {
  const tx = service.buildMintTransaction({
    from: '0x0000000000000000000000000000000000000003',
    tokenURI: 'ipfs://rentverse/property-1',
  });

  assert.equal(tx.to, '0x0000000000000000000000000000000000000001');
  assert.equal(tx.from, '0x0000000000000000000000000000000000000003');
  assert.equal(tx.chainId, 11155111);
  assert.equal(tx.value, '0x0');
  assert.match(tx.data, /^0x[0-9a-f]+$/i);
});

test('buildMintTransaction rejects an invalid sender address', () => {
  assert.throws(
    () =>
      service.buildMintTransaction({
        from: 'not-an-address',
        tokenURI: 'ipfs://rentverse/property-1',
      }),
    (error) => error.code === 'INVALID_FROM_ADDRESS' && error.statusCode === 400
  );
});

test('buildMintTransaction bounds token URI input', () => {
  assert.throws(
    () =>
      service.buildMintTransaction({
        from: '0x0000000000000000000000000000000000000003',
        tokenURI: 'x'.repeat(2049),
      }),
    (error) => error.code === 'INVALID_TOKEN_URI' && error.statusCode === 400
  );
});
