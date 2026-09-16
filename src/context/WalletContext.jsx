import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const WalletContext = createContext(null);

function normalizeChainId(chainId) {
  if (!chainId) return null;

  if (typeof chainId === 'number') return chainId;
  if (typeof chainId === 'string' && chainId.startsWith('0x')) {
    return Number.parseInt(chainId, 16);
  }

  return Number.parseInt(chainId, 10);
}

function getProvider() {
  return typeof window !== 'undefined' ? window.ethereum : undefined;
}

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const syncWalletState = useCallback(async () => {
    const provider = getProvider();

    if (!provider?.request) {
      setStatus('unavailable');
      return;
    }

    try {
      const [accounts, currentChainId] = await Promise.all([
        provider.request({ method: 'eth_accounts' }),
        provider.request({ method: 'eth_chainId' }),
      ]);

      setAccount(accounts?.[0] ?? null);
      setChainId(normalizeChainId(currentChainId));
      setStatus(accounts?.[0] ? 'connected' : 'idle');
    } catch (walletError) {
      setError(walletError?.message || 'Unable to read wallet state.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    const provider = getProvider();

    syncWalletState();

    if (!provider?.on) return undefined;

    const handleAccountsChanged = (accounts) => {
      setAccount(accounts?.[0] ?? null);
      setStatus(accounts?.[0] ? 'connected' : 'idle');
      setError(null);
    };

    const handleChainChanged = (nextChainId) => {
      setChainId(normalizeChainId(nextChainId));
    };

    const handleDisconnect = () => {
      setAccount(null);
      setStatus('idle');
    };

    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);
    provider.on('disconnect', handleDisconnect);

    return () => {
      provider.removeListener?.('accountsChanged', handleAccountsChanged);
      provider.removeListener?.('chainChanged', handleChainChanged);
      provider.removeListener?.('disconnect', handleDisconnect);
    };
  }, [syncWalletState]);

  const connectWallet = useCallback(async () => {
    const provider = getProvider();

    setError(null);

    if (!provider?.request) {
      const message =
        'No EVM wallet was detected. Install MetaMask or another EIP-1193 compatible wallet.';
      setError(message);
      setStatus('unavailable');
      throw new Error(message);
    }

    try {
      setStatus('connecting');

      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      const currentChainId = await provider.request({ method: 'eth_chainId' });
      const selectedAccount = accounts?.[0] ?? null;

      setAccount(selectedAccount);
      setChainId(normalizeChainId(currentChainId));
      setStatus(selectedAccount ? 'connected' : 'idle');

      return selectedAccount;
    } catch (walletError) {
      const message =
        walletError?.code === 4001
          ? 'Wallet connection request was rejected.'
          : walletError?.message || 'Unable to connect wallet.';

      setError(message);
      setStatus('error');
      throw walletError;
    }
  }, []);

  // EIP-1193 wallets generally do not expose a universal programmatic disconnect.
  // This clears only the app session; the user controls permissions in the wallet.
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setError(null);
    setStatus('idle');
  }, []);

  const value = useMemo(
    () => ({
      account,
      chainId,
      error,
      status,
      isConnected: Boolean(account),
      isConnecting: status === 'connecting',
      connectWallet,
      disconnectWallet,
      refreshWallet: syncWalletState,
    }),
    [
      account,
      chainId,
      connectWallet,
      disconnectWallet,
      error,
      status,
      syncWalletState,
    ]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error('useWallet must be used inside WalletProvider');
  }

  return context;
}
