const successEnvelope = (dataSchema, extra = {}) => ({
  type: 'object',
  required: ['success', 'data'],
  properties: {
    success: { type: 'boolean', example: true },
    data: dataSchema,
    ...extra,
  },
});

const transactionSchema = {
  type: 'object',
  required: ['from', 'to', 'data', 'value', 'chainId'],
  properties: {
    from: { $ref: '#/components/schemas/Address' },
    to: { $ref: '#/components/schemas/Address' },
    data: {
      type: 'string',
      description: 'ABI-encoded EVM calldata to be signed by the client wallet.',
      example: '0x1234abcd',
    },
    value: {
      type: 'string',
      description: 'Hex-encoded transaction value.',
      example: '0x0',
    },
    valueWei: {
      type: 'string',
      description: 'Decimal wei value when the operation requires native currency.',
      example: '100000000000000000',
    },
    chainId: { type: 'integer', example: 11155111 },
  },
};

const signingMeta = {
  type: 'object',
  required: ['signingRequired', 'signingLocation'],
  properties: {
    signingRequired: { type: 'boolean', example: true },
    signingLocation: { type: 'string', enum: ['client-wallet'], example: 'client-wallet' },
  },
};

const errorResponses = {
  '400': { $ref: '#/components/responses/BadRequest' },
  '403': { $ref: '#/components/responses/Forbidden' },
  '409': { $ref: '#/components/responses/Conflict' },
  '500': { $ref: '#/components/responses/InternalServerError' },
  '502': { $ref: '#/components/responses/BadGateway' },
  '503': { $ref: '#/components/responses/ServiceUnavailable' },
};

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'RentVerse API',
    version: '1.0.0',
    description:
      'Backend API for RentVerse smart-contract reads and client-wallet transaction construction. The server never receives or stores user private keys.',
  },
  servers: [
    {
      url: 'http://localhost:3099',
      description: 'Local development server',
    },
  ],
  tags: [
    { name: 'Service', description: 'Application-level health endpoints.' },
    { name: 'Blockchain', description: 'Blockchain configuration and RPC connectivity.' },
    { name: 'RealEstate', description: 'RealEstate NFT contract reads and transaction builders.' },
    { name: 'Escrow', description: 'Escrow contract reads and transaction builders.' },
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['Service'],
        summary: 'Check API service health',
        operationId: 'getApiHealth',
        responses: {
          '200': {
            description: 'API process is healthy.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['success', 'service', 'timestamp'],
                  properties: {
                    success: { type: 'boolean', example: true },
                    service: { type: 'string', example: 'rentverse-api' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/contracts/health': {
      get: {
        tags: ['Blockchain'],
        summary: 'Check blockchain RPC and configuration health',
        operationId: 'getBlockchainHealth',
        responses: {
          '200': {
            description: 'Blockchain configuration state and, when available, live network data.',
            content: {
              'application/json': {
                schema: successEnvelope({ $ref: '#/components/schemas/BlockchainHealth' }),
              },
            },
          },
          '502': errorResponses['502'],
        },
      },
    },
    '/api/v1/contracts/real-estate': {
      get: {
        tags: ['RealEstate'],
        summary: 'Get RealEstate contract summary',
        operationId: 'getRealEstateSummary',
        responses: {
          '200': {
            description: 'Configured contract address and total NFT supply.',
            content: {
              'application/json': {
                schema: successEnvelope({
                  type: 'object',
                  required: ['address', 'chainId', 'totalSupply'],
                  properties: {
                    address: { $ref: '#/components/schemas/Address' },
                    chainId: { type: 'integer', example: 11155111 },
                    totalSupply: { type: 'string', example: '12' },
                  },
                }),
              },
            },
          },
          '500': errorResponses['500'],
          '502': errorResponses['502'],
          '503': errorResponses['503'],
        },
      },
    },
    '/api/v1/contracts/real-estate/tokens/{tokenId}': {
      get: {
        tags: ['RealEstate'],
        summary: 'Get a RealEstate NFT',
        operationId: 'getRealEstateToken',
        parameters: [{ $ref: '#/components/parameters/TokenId' }],
        responses: {
          '200': {
            description: 'NFT owner, metadata URI and contract context.',
            content: {
              'application/json': {
                schema: successEnvelope({
                  type: 'object',
                  required: ['tokenId', 'owner', 'tokenURI', 'contractAddress', 'chainId'],
                  properties: {
                    tokenId: { type: 'string', example: '1' },
                    owner: { $ref: '#/components/schemas/Address' },
                    tokenURI: { type: 'string', example: 'ipfs://rentverse/property-1' },
                    contractAddress: { $ref: '#/components/schemas/Address' },
                    chainId: { type: 'integer', example: 11155111 },
                  },
                }),
              },
            },
          },
          '400': errorResponses['400'],
          '500': errorResponses['500'],
          '502': errorResponses['502'],
          '503': errorResponses['503'],
        },
      },
    },
    '/api/v1/contracts/escrow/{tokenId}': {
      get: {
        tags: ['Escrow'],
        summary: 'Get escrow listing state',
        operationId: 'getEscrowListing',
        parameters: [{ $ref: '#/components/parameters/TokenId' }],
        responses: {
          '200': {
            description: 'Current listing, buyer, pricing and inspection state.',
            content: {
              'application/json': {
                schema: successEnvelope({
                  type: 'object',
                  required: [
                    'tokenId',
                    'isListed',
                    'purchasePriceWei',
                    'purchasePriceEth',
                    'escrowAmountWei',
                    'escrowAmountEth',
                    'buyer',
                    'inspectionPassed',
                    'contractAddress',
                    'chainId',
                  ],
                  properties: {
                    tokenId: { type: 'string', example: '1' },
                    isListed: { type: 'boolean', example: true },
                    purchasePriceWei: { type: 'string', example: '1000000000000000000' },
                    purchasePriceEth: { type: 'string', example: '1.0' },
                    escrowAmountWei: { type: 'string', example: '100000000000000000' },
                    escrowAmountEth: { type: 'string', example: '0.1' },
                    buyer: { $ref: '#/components/schemas/Address' },
                    inspectionPassed: { type: 'boolean', example: false },
                    contractAddress: { $ref: '#/components/schemas/Address' },
                    chainId: { type: 'integer', example: 11155111 },
                  },
                }),
              },
            },
          },
          '400': errorResponses['400'],
          '500': errorResponses['500'],
          '502': errorResponses['502'],
          '503': errorResponses['503'],
        },
      },
    },
    '/api/v1/contracts/real-estate/mint/transaction': {
      post: {
        tags: ['RealEstate'],
        summary: 'Build an unsigned NFT mint transaction',
        description: 'Returns allowlisted calldata. The connected browser wallet must sign and submit the transaction.',
        operationId: 'buildMintTransaction',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MintTransactionRequest' },
              example: {
                from: '0x1111111111111111111111111111111111111111',
                tokenURI: 'ipfs://rentverse/property-1',
              },
            },
          },
        },
        responses: {
          '200': { $ref: '#/components/responses/TransactionBuilt' },
          '400': errorResponses['400'],
          '500': errorResponses['500'],
          '503': errorResponses['503'],
        },
      },
    },
    '/api/v1/contracts/escrow/{tokenId}/deposit/transaction': {
      post: {
        tags: ['Escrow'],
        summary: 'Build an unsigned earnest-deposit transaction',
        description: 'Reads the listing to validate the buyer and calculates the required native-currency value.',
        operationId: 'buildEarnestDepositTransaction',
        parameters: [{ $ref: '#/components/parameters/TokenId' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/WalletTransactionRequest' },
              example: { from: '0x1111111111111111111111111111111111111111' },
            },
          },
        },
        responses: {
          '200': { $ref: '#/components/responses/TransactionBuilt' },
          '400': errorResponses['400'],
          '403': errorResponses['403'],
          '409': errorResponses['409'],
          '500': errorResponses['500'],
          '502': errorResponses['502'],
          '503': errorResponses['503'],
        },
      },
    },
    '/api/v1/contracts/escrow/{tokenId}/approve/transaction': {
      post: {
        tags: ['Escrow'],
        summary: 'Build an unsigned sale-approval transaction',
        operationId: 'buildApproveSaleTransaction',
        parameters: [{ $ref: '#/components/parameters/TokenId' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/WalletTransactionRequest' },
              example: { from: '0x1111111111111111111111111111111111111111' },
            },
          },
        },
        responses: {
          '200': { $ref: '#/components/responses/TransactionBuilt' },
          '400': errorResponses['400'],
          '500': errorResponses['500'],
          '503': errorResponses['503'],
        },
      },
    },
  },
  components: {
    parameters: {
      TokenId: {
        name: 'tokenId',
        in: 'path',
        required: true,
        description: 'Non-negative integer token identifier.',
        schema: { type: 'integer', minimum: 0, example: 1 },
      },
    },
    schemas: {
      Address: {
        type: 'string',
        pattern: '^0x[a-fA-F0-9]{40}$',
        example: '0x1111111111111111111111111111111111111111',
      },
      ConfigurationState: {
        type: 'object',
        properties: {
          rpcConfigured: { type: 'boolean', example: true },
          realEstateConfigured: { type: 'boolean', example: true },
          escrowConfigured: { type: 'boolean', example: true },
        },
      },
      BlockchainHealth: {
        type: 'object',
        required: ['status', 'configured'],
        properties: {
          status: { type: 'string', enum: ['ok', 'degraded'], example: 'ok' },
          configured: { $ref: '#/components/schemas/ConfigurationState' },
          message: { type: 'string', example: 'Set BLOCKCHAIN_RPC_URL to enable live chain reads.' },
          network: {
            type: 'object',
            properties: {
              chainId: { type: 'integer', example: 11155111 },
              name: { type: 'string', example: 'sepolia' },
              blockNumber: { type: 'integer', example: 7412345 },
            },
          },
        },
      },
      WalletTransactionRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['from'],
        properties: {
          from: { $ref: '#/components/schemas/Address' },
        },
      },
      MintTransactionRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['from', 'tokenURI'],
        properties: {
          from: { $ref: '#/components/schemas/Address' },
          tokenURI: {
            type: 'string',
            minLength: 1,
            maxLength: 2048,
            example: 'ipfs://rentverse/property-1',
          },
        },
      },
      Transaction: transactionSchema,
      SigningMeta: signingMeta,
      ApiError: {
        type: 'object',
        required: ['success', 'error'],
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string', example: 'INVALID_TOKEN_ID' },
              message: { type: 'string', example: 'tokenId must be a non-negative integer.' },
              details: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
    },
    responses: {
      TransactionBuilt: {
        description: 'Unsigned EVM transaction data ready for client-wallet signing.',
        content: {
          'application/json': {
            schema: successEnvelope(
              { $ref: '#/components/schemas/Transaction' },
              { meta: { $ref: '#/components/schemas/SigningMeta' } }
            ),
          },
        },
      },
      BadRequest: {
        description: 'Invalid request input.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
      },
      Forbidden: {
        description: 'The supplied wallet is not authorized for the requested operation.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
      },
      Conflict: {
        description: 'The current on-chain state does not allow the operation.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
      },
      InternalServerError: {
        description: 'Server or contract configuration is invalid.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
      },
      BadGateway: {
        description: 'The configured blockchain provider returned an error.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
      },
      ServiceUnavailable: {
        description: 'Required blockchain configuration is missing.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
      },
    },
  },
};

module.exports = openApiSpec;
