const DEFAULT_CHAIN_ID = 11155111; // Ethereum Sepolia

function parseChainId(rawValue) {
  const parsed = Number.parseInt(rawValue || DEFAULT_CHAIN_ID, 10);
  return Number.isFinite(parsed) ? parsed : DEFAULT_CHAIN_ID;
}

const blockchainConfig = Object.freeze({
  rpcUrl: process.env.BLOCKCHAIN_RPC_URL || '',
  chainId: parseChainId(process.env.BLOCKCHAIN_CHAIN_ID),
  realEstateAddress: process.env.REAL_ESTATE_CONTRACT_ADDRESS || '',
  escrowAddress: process.env.ESCROW_CONTRACT_ADDRESS || '',
});

function configurationState() {
  return {
    rpcConfigured: Boolean(blockchainConfig.rpcUrl),
    realEstateConfigured: Boolean(blockchainConfig.realEstateAddress),
    escrowConfigured: Boolean(blockchainConfig.escrowAddress),
    chainId: blockchainConfig.chainId,
  };
}

module.exports = {
  blockchainConfig,
  configurationState,
};
