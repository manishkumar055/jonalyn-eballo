const express = require('express');
const contractController = require('../controllers/contractController');

const router = express.Router();

// Connectivity / observability
router.get('/health', contractController.health);

// Allowlisted read operations
router.get('/real-estate', contractController.realEstateSummary);
router.get('/real-estate/tokens/:tokenId', contractController.realEstateToken);
router.get('/escrow/:tokenId', contractController.escrowListing);

// Transaction builders. The server returns calldata; the user's wallet signs it.
router.post('/real-estate/mint/transaction', contractController.mintTransaction);
router.post(
  '/escrow/:tokenId/deposit/transaction',
  contractController.earnestDepositTransaction
);
router.post(
  '/escrow/:tokenId/approve/transaction',
  contractController.approveSaleTransaction
);

module.exports = router;
