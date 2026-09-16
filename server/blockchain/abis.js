const REAL_ESTATE_ABI = [
  'function totalSupply() view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function mint(string tokenURI) returns (uint256)',
];

const ESCROW_ABI = [
  'function isListed(uint256 tokenId) view returns (bool)',
  'function purchasePrice(uint256 tokenId) view returns (uint256)',
  'function escrowAmount(uint256 tokenId) view returns (uint256)',
  'function buyer(uint256 tokenId) view returns (address)',
  'function inspectionPassed(uint256 tokenId) view returns (bool)',
  'function approval(uint256 tokenId, address approver) view returns (bool)',
  'function getBalance() view returns (uint256)',
  'function depositEarnest(uint256 tokenId) payable',
  'function approveSale(uint256 tokenId)',
];

module.exports = {
  REAL_ESTATE_ABI,
  ESCROW_ABI,
};
