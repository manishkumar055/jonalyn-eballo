class BlockchainApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'BlockchainApiError';
    this.statusCode = options.statusCode || 500;
    this.code = options.code || 'BLOCKCHAIN_ERROR';
    this.details = options.details;
  }
}

module.exports = { BlockchainApiError };
