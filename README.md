# RentVerse — wallet, theme, and smart-contract API assignment

This repository extends the provided RentVerse frontend with three focused engineering changes while preserving the existing product UI:

- EIP-1193 wallet connection from the primary navigation, available on the landing page and responsive mobile menu.
- Persistent light/dark theme support using React Context, Tailwind class mode, and a compatibility layer for the existing screens.
- A versioned Express API for allowlisted smart-contract reads and wallet-signed transaction construction.

The implementation intentionally does **not** put user private keys on the backend. Read operations are performed by the server through an RPC provider; write endpoints return unsigned transaction data which the connected browser wallet signs and submits.

The source repository also contains unrelated legacy e-commerce server files. They are left in place for source-history preservation but are **not mounted by the new API server**, so the blockchain assignment does not depend on legacy database/email/payment configuration.

## Architecture

```text
Browser / React
├── ThemeContext
├── WalletContext (EIP-1193)
├── contractApi client
└── Existing RentVerse pages
          │
          │ HTTP /api/v1/contracts
          ▼
Express API
├── routes/contractRoute.js
├── controllers/contractController.js
├── blockchain/contractService.js
├── blockchain/abis.js
├── validation + normalized errors
└── ethers JsonRpcProvider
          │
          ▼
Configured EVM network
├── RealEstate contract
└── Escrow contract
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the engineering decisions and scaling path.

## Local setup

Requirements: a current Node.js LTS release, npm, and an EIP-1193 compatible browser wallet such as MetaMask.

```bash
npm install --legacy-peer-deps
cp server/config/config.env.example .env
npm start
```

The React app starts on the normal Create React App development port and the API defaults to `http://localhost:3099`.

### Environment variables

Configure these values in `.env`:

```dotenv
PORT=3099
CLIENT_ORIGIN=http://localhost:3000
BLOCKCHAIN_RPC_URL=https://YOUR_RPC_ENDPOINT
BLOCKCHAIN_CHAIN_ID=11155111
REAL_ESTATE_CONTRACT_ADDRESS=0xYOUR_REAL_ESTATE_CONTRACT
ESCROW_CONTRACT_ADDRESS=0xYOUR_ESCROW_CONTRACT
```

No backend private key is required for the assignment implementation.

If the frontend and API are hosted on separate origins, set:

```dotenv
REACT_APP_API_URL=http://localhost:3099/api/v1
```

When they share an origin, the client defaults to `/api/v1`.

## Wallet behavior

The wallet layer:

- calls `eth_requestAccounts` only after a user action;
- restores already-authorized accounts with `eth_accounts`;
- tracks `accountsChanged`, `chainChanged`, and `disconnect` events;
- exposes connection state through React Context so wallet state is not duplicated across screens;
- never requests a seed phrase or private key.

A local “disconnect” clears the RentVerse UI session. Wallet permissions remain controlled by the wallet itself, which is the expected EIP-1193 behavior.

## Dark mode

The selected theme is stored under `rentverse-theme` in local storage. If no preference exists, the app starts from the operating-system color scheme. The theme is applied by toggling the `dark` class on the document root.

The pre-built UI uses literal Tailwind palette utilities throughout many pages, so `src/index.css` contains a scoped compatibility layer. This keeps the assignment change small and safe while making existing cards, backgrounds, typography, borders, and inputs readable in dark mode.

## Smart-contract API

Base path: `/api/v1/contracts`

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | RPC/network connectivity and configuration status |
| `GET` | `/real-estate` | RealEstate contract address and total supply |
| `GET` | `/real-estate/tokens/:tokenId` | Token owner and token URI |
| `GET` | `/escrow/:tokenId` | Escrow listing state |
| `POST` | `/real-estate/mint/transaction` | Build unsigned mint calldata |
| `POST` | `/escrow/:tokenId/deposit/transaction` | Build buyer earnest-deposit transaction |
| `POST` | `/escrow/:tokenId/approve/transaction` | Build sale-approval transaction |

### Swagger / OpenAPI documentation

After starting the server, open:

- `http://localhost:3099/api-docs/` — interactive Swagger UI with **Try it out** support.
- `http://localhost:3099/docs` — convenience redirect to Swagger UI.
- `http://localhost:3099/api-docs.json` — raw OpenAPI 3.0.3 document for API clients and tooling.

The checked-in specification lives at `server/docs/openapi.js`. It documents the general service health route plus every `/api/v1/contracts` endpoint, including request bodies, path parameters, success payloads, transaction signing metadata, and normalized error responses.

### Example: health

```bash
curl http://localhost:3099/api/v1/contracts/health
```

### Example: read an NFT

```bash
curl http://localhost:3099/api/v1/contracts/real-estate/tokens/1
```

### Example: build a mint transaction

```bash
curl -X POST http://localhost:3099/api/v1/contracts/real-estate/mint/transaction \
  -H 'Content-Type: application/json' \
  -d '{
    "from":"0x1111111111111111111111111111111111111111",
    "tokenURI":"ipfs://rentverse/property-1"
  }'
```

The response contains only `from`, `to`, `data`, `value`, and `chainId`. A wallet can pass those values to `eth_sendTransaction` so signing remains on the client.

## Tests

```bash
npm run test:api
npm run build
```

The API test suite covers smart-contract transaction encoding and validation plus the OpenAPI JSON, Swagger UI page, and `/docs` redirect without requiring a live blockchain node.

## Security and maintainability choices

- Contract operations are explicit and allowlisted; there is no arbitrary “call any address/method” endpoint.
- User private keys never cross the browser boundary.
- RPC URLs and contract addresses are environment configuration, not hard-coded production values.
- Server errors are normalized and production responses avoid leaking provider internals.
- API routes are versioned to support future contract migrations.
- Request body size and CORS origins are bounded.
- Local secret files are ignored.
- The API specification is checked into source control so documentation changes can be reviewed alongside implementation changes.

## Scope

This is intentionally an engineering sample rather than a production deployment. A production version would additionally include authenticated write policies, rate limiting, chain-specific confirmations/reorg handling, observability, contract-event indexing, ABI/version management, RPC failover, integration tests against a local or testnet chain, and a deployment pipeline.
