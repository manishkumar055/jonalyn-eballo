const contractService = require('../blockchain/contractService');

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

const health = asyncRoute(async (req, res) => {
  const data = await contractService.getHealth();
  res.status(200).json({ success: true, data });
});

const realEstateSummary = asyncRoute(async (req, res) => {
  const data = await contractService.getRealEstateSummary();
  res.status(200).json({ success: true, data });
});

const realEstateToken = asyncRoute(async (req, res) => {
  const data = await contractService.getRealEstateToken(req.params.tokenId);
  res.status(200).json({ success: true, data });
});

const escrowListing = asyncRoute(async (req, res) => {
  const data = await contractService.getEscrowListing(req.params.tokenId);
  res.status(200).json({ success: true, data });
});

const mintTransaction = asyncRoute(async (req, res) => {
  const data = contractService.buildMintTransaction({
    from: req.body?.from,
    tokenURI: req.body?.tokenURI,
  });

  res.status(200).json({
    success: true,
    data,
    meta: {
      signingRequired: true,
      signingLocation: 'client-wallet',
    },
  });
});

const earnestDepositTransaction = asyncRoute(async (req, res) => {
  const data = await contractService.buildEarnestDepositTransaction({
    from: req.body?.from,
    tokenId: req.params.tokenId,
  });

  res.status(200).json({
    success: true,
    data,
    meta: {
      signingRequired: true,
      signingLocation: 'client-wallet',
    },
  });
});

const approveSaleTransaction = asyncRoute(async (req, res) => {
  const data = contractService.buildApproveSaleTransaction({
    from: req.body?.from,
    tokenId: req.params.tokenId,
  });

  res.status(200).json({
    success: true,
    data,
    meta: {
      signingRequired: true,
      signingLocation: 'client-wallet',
    },
  });
});

module.exports = {
  health,
  realEstateSummary,
  realEstateToken,
  escrowListing,
  mintTransaction,
  earnestDepositTransaction,
  approveSaleTransaction,
};
