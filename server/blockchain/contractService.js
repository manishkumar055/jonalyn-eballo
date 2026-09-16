const { ethers } = require('ethers');
const { REAL_ESTATE_ABI, ESCROW_ABI } = require('./abis');
const { blockchainConfig, configurationState } = require('./config');
const { BlockchainApiError } = require('./errors');

let providerInstance;

function requireConfig(value, variableName) {
  if (!value) {
    throw new BlockchainApiError(
      `${variableName} is not configured for the contract API.`,
      {
        statusCode: 503,
        code: 'BLOCKCHAIN_NOT_CONFIGURED',
      }
    );
  }

  return value;
}

function requireAddress(value, variableName) {
  const address = requireConfig(value, variableName);

  if (!ethers.utils.isAddress(address)) {
    throw new BlockchainApiError(`${variableName} is not a valid EVM address.`, {
      statusCode: 500,
      code: 'INVALID_SERVER_CONFIGURATION',
    });
  }

  return ethers.utils.getAddress(address);
}

function parseTokenId(rawTokenId) {
  if (rawTokenId === undefined || rawTokenId === null || !/^\d+$/.test(String(rawTokenId))) {
    throw new BlockchainApiError('tokenId must be a non-negative integer.', {
      statusCode: 400,
      code: 'INVALID_TOKEN_ID',
    });
  }

  return ethers.BigNumber.from(String(rawTokenId));
}

function requireFromAddress(rawAddress) {
  if (!rawAddress || !ethers.utils.isAddress(rawAddress)) {
    throw new BlockchainApiError('from must be a valid EVM address.', {
      statusCode: 400,
      code: 'INVALID_FROM_ADDRESS',
    });
  }

  return ethers.utils.getAddress(rawAddress);
}

function getProvider() {
  if (!providerInstance) {
    const rpcUrl = requireConfig(blockchainConfig.rpcUrl, 'BLOCKCHAIN_RPC_URL');
    providerInstance = new ethers.providers.StaticJsonRpcProvider(
      rpcUrl,
      blockchainConfig.chainId
    );
  }

  return providerInstance;
}

function getRealEstateContract() {
  const address = requireAddress(
    blockchainConfig.realEstateAddress,
    'REAL_ESTATE_CONTRACT_ADDRESS'
  );

  return new ethers.Contract(address, REAL_ESTATE_ABI, getProvider());
}

function getEscrowContract() {
  const address = requireAddress(
    blockchainConfig.escrowAddress,
    'ESCROW_CONTRACT_ADDRESS'
  );

  return new ethers.Contract(address, ESCROW_ABI, getProvider());
}

function wrapProviderError(error, operation) {
  if (error instanceof BlockchainApiError) return error;

  const reason = error?.reason || error?.error?.message || error?.message;
  return new BlockchainApiError(`Blockchain operation failed: ${operation}.`, {
    statusCode: 502,
    code: 'BLOCKCHAIN_PROVIDER_ERROR',
    details:
      process.env.NODE_ENV === 'development' && reason
        ? { reason }
        : undefined,
  });
}

async function getHealth() {
  const configured = configurationState();

  if (!configured.rpcConfigured) {
    return {
      status: 'degraded',
      configured,
      message: 'Set BLOCKCHAIN_RPC_URL to enable live chain reads.',
    };
  }

  try {
    const provider = getProvider();
    const [network, blockNumber] = await Promise.all([
      provider.getNetwork(),
      provider.getBlockNumber(),
    ]);

    return {
      status: 'ok',
      configured,
      network: {
        chainId: network.chainId,
        name: network.name,
        blockNumber,
      },
    };
  } catch (error) {
    throw wrapProviderError(error, 'health check');
  }
}

async function getRealEstateSummary() {
  try {
    const contract = getRealEstateContract();
    const totalSupply = await contract.totalSupply();

    return {
      address: contract.address,
      chainId: blockchainConfig.chainId,
      totalSupply: totalSupply.toString(),
    };
  } catch (error) {
    throw wrapProviderError(error, 'read real-estate contract summary');
  }
}

async function getRealEstateToken(rawTokenId) {
  const tokenId = parseTokenId(rawTokenId);

  try {
    const contract = getRealEstateContract();
    const [owner, tokenURI] = await Promise.all([
      contract.ownerOf(tokenId),
      contract.tokenURI(tokenId),
    ]);

    return {
      tokenId: tokenId.toString(),
      owner,
      tokenURI,
      contractAddress: contract.address,
      chainId: blockchainConfig.chainId,
    };
  } catch (error) {
    throw wrapProviderError(error, `read token ${tokenId.toString()}`);
  }
}

async function getEscrowListing(rawTokenId) {
  const tokenId = parseTokenId(rawTokenId);

  try {
    const contract = getEscrowContract();
    const [isListed, purchasePrice, escrowAmount, buyer, inspectionPassed] =
      await Promise.all([
        contract.isListed(tokenId),
        contract.purchasePrice(tokenId),
        contract.escrowAmount(tokenId),
        contract.buyer(tokenId),
        contract.inspectionPassed(tokenId),
      ]);

    return {
      tokenId: tokenId.toString(),
      isListed,
      purchasePriceWei: purchasePrice.toString(),
      purchasePriceEth: ethers.utils.formatEther(purchasePrice),
      escrowAmountWei: escrowAmount.toString(),
      escrowAmountEth: ethers.utils.formatEther(escrowAmount),
      buyer,
      inspectionPassed,
      contractAddress: contract.address,
      chainId: blockchainConfig.chainId,
    };
  } catch (error) {
    throw wrapProviderError(error, `read escrow listing ${tokenId.toString()}`);
  }
}

function buildMintTransaction({ from, tokenURI }) {
  const sender = requireFromAddress(from);
  const contractAddress = requireAddress(
    blockchainConfig.realEstateAddress,
    'REAL_ESTATE_CONTRACT_ADDRESS'
  );

  if (!tokenURI || typeof tokenURI !== 'string' || tokenURI.length > 2048) {
    throw new BlockchainApiError(
      'tokenURI is required and must be at most 2048 characters.',
      {
        statusCode: 400,
        code: 'INVALID_TOKEN_URI',
      }
    );
  }

  const contractInterface = new ethers.utils.Interface(REAL_ESTATE_ABI);

  return {
    from: sender,
    to: contractAddress,
    data: contractInterface.encodeFunctionData('mint', [tokenURI]),
    value: '0x0',
    chainId: blockchainConfig.chainId,
  };
}

async function buildEarnestDepositTransaction({ from, tokenId: rawTokenId }) {
  const sender = requireFromAddress(from);
  const tokenId = parseTokenId(rawTokenId);
  const contract = getEscrowContract();

  try {
    const [buyer, escrowAmount, isListed] = await Promise.all([
      contract.buyer(tokenId),
      contract.escrowAmount(tokenId),
      contract.isListed(tokenId),
    ]);

    if (!isListed) {
      throw new BlockchainApiError('The requested token is not currently listed.', {
        statusCode: 409,
        code: 'TOKEN_NOT_LISTED',
      });
    }

    if (buyer.toLowerCase() !== sender.toLowerCase()) {
      throw new BlockchainApiError(
        'The connected wallet is not the buyer configured for this listing.',
        {
          statusCode: 403,
          code: 'BUYER_MISMATCH',
        }
      );
    }

    const contractInterface = new ethers.utils.Interface(ESCROW_ABI);

    return {
      from: sender,
      to: contract.address,
      data: contractInterface.encodeFunctionData('depositEarnest', [tokenId]),
      value: ethers.utils.hexValue(escrowAmount),
      valueWei: escrowAmount.toString(),
      chainId: blockchainConfig.chainId,
    };
  } catch (error) {
    throw wrapProviderError(
      error,
      `build earnest-deposit transaction for token ${tokenId.toString()}`
    );
  }
}

function buildApproveSaleTransaction({ from, tokenId: rawTokenId }) {
  const sender = requireFromAddress(from);
  const tokenId = parseTokenId(rawTokenId);
  const contractAddress = requireAddress(
    blockchainConfig.escrowAddress,
    'ESCROW_CONTRACT_ADDRESS'
  );
  const contractInterface = new ethers.utils.Interface(ESCROW_ABI);

  return {
    from: sender,
    to: contractAddress,
    data: contractInterface.encodeFunctionData('approveSale', [tokenId]),
    value: '0x0',
    chainId: blockchainConfig.chainId,
  };
}

module.exports = {
  getHealth,
  getRealEstateSummary,
  getRealEstateToken,
  getEscrowListing,
  buildMintTransaction,
  buildEarnestDepositTransaction,
  buildApproveSaleTransaction,
};
