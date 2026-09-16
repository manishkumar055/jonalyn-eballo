# Smart-contract API architecture

## Goal

The assignment asks for a backend layer that can interact with smart contracts while demonstrating maintainable structure rather than implementing every protocol feature. The main design goal is therefore to keep chain-specific concerns behind a small service boundary and preserve browser-wallet custody.

## Request flow

1. `contractRoute.js` defines the public, versioned REST surface.
2. `contractController.js` maps HTTP inputs/outputs and delegates all chain behavior.
3. `contractService.js` validates EVM inputs, creates the provider/contracts, performs reads, and encodes allowed writes.
4. `abis.js` owns the minimal ABI surface needed by the API.
5. `errorHandler.js` converts known domain errors to stable API error payloads.

This keeps Express details out of blockchain code and makes the chain service replaceable/testable.

The source tree includes legacy commerce routes/controllers that are unrelated to the stated assignment and were already non-functional without external services. The new server deliberately does not import or mount them; this keeps the reviewable contract API independently runnable and prevents hidden startup coupling to MongoDB, email, payment, or media providers.

## Read versus write model

### Reads

The API server owns a read-only JSON-RPC connection and directly executes view calls. This creates one place for future caching, retries, provider failover, metrics, and event-indexer integration.

### Writes

The API never accepts a user secret. It validates the requested operation and produces the exact allowlisted calldata for that operation. The browser wallet signs/submits that transaction.

This approach gives the backend control over the supported contract interface without turning the server into a hot-wallet custodian.

A relayer can be added later as a separate signer adapter for use cases that intentionally require gas sponsorship or privileged automation. It should not be mixed into the normal user-wallet path.

## Scalability path

For a production system I would evolve the sample in this order:

1. Move each contract family behind an adapter (`RealEstateAdapter`, `EscrowAdapter`) and version adapters alongside deployed contract versions.
2. Add schema validation (for example Zod/Joi) at the HTTP boundary.
3. Add Redis caching for stable reads and per-wallet/IP rate limiting.
4. Subscribe to contract events and persist normalized projections in a database instead of reconstructing every screen from live RPC calls.
5. Add an RPC provider pool with timeout, retry, circuit-breaker, and health scoring.
6. Add transaction lifecycle tracking: submitted, confirmed, reverted, replaced, and reorged.
7. Add OpenTelemetry traces/metrics with chain ID, contract operation, provider latency, and error class.
8. Run contract integration tests against Anvil/Hardhat plus smoke tests against the chosen testnet.

## Security decisions

- No arbitrary target address or arbitrary function signature is accepted from clients.
- Contract addresses come from server configuration.
- EVM addresses and token IDs are validated before encoding/calling.
- Server-side error responses hide raw RPC details outside development.
- CORS is an explicit allowlist.
- Request body size is bounded.
- Secret/config files are not committed.
- A future server-side signer should live in a separate, policy-checked module backed by a managed KMS/HSM rather than an environment private key.

## Theme architecture

Theme state is application-wide, so React Context owns the preference. The selected theme is persisted locally and applied as a root `dark` class. Existing pages already contain many fixed Tailwind palette classes; a scoped compatibility layer prevents a broad visual rewrite and reduces regression risk. New components use Tailwind `dark:` variants directly.

## Wallet architecture

`WalletContext` is the single EIP-1193 integration point. It owns account/chain state and provider event listeners. UI components consume that state rather than calling `window.ethereum` independently, which prevents duplicate prompts and stale account state as the application grows.
