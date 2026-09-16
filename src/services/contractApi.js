const API_ROOT = (process.env.REACT_APP_API_URL || '/api/v1').replace(/\/$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${API_ROOT}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      payload?.error?.message || `API request failed with status ${response.status}`
    );
    error.code = payload?.error?.code;
    error.status = response.status;
    throw error;
  }

  return payload.data;
}

export const contractApi = {
  health() {
    return request('/contracts/health');
  },

  realEstateSummary() {
    return request('/contracts/real-estate');
  },

  realEstateToken(tokenId) {
    return request(`/contracts/real-estate/tokens/${encodeURIComponent(tokenId)}`);
  },

  escrowListing(tokenId) {
    return request(`/contracts/escrow/${encodeURIComponent(tokenId)}`);
  },

  buildMintTransaction({ from, tokenURI }) {
    return request('/contracts/real-estate/mint/transaction', {
      method: 'POST',
      body: JSON.stringify({ from, tokenURI }),
    });
  },

  buildEarnestDepositTransaction({ from, tokenId }) {
    return request(`/contracts/escrow/${encodeURIComponent(tokenId)}/deposit/transaction`, {
      method: 'POST',
      body: JSON.stringify({ from }),
    });
  },

  buildApproveSaleTransaction({ from, tokenId }) {
    return request(`/contracts/escrow/${encodeURIComponent(tokenId)}/approve/transaction`, {
      method: 'POST',
      body: JSON.stringify({ from }),
    });
  },
};
