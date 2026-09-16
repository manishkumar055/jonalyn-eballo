import { FaWallet } from 'react-icons/fa';
import { useWallet } from '../../context/WalletContext';

function formatAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function WalletButton({ className = '' }) {
  const {
    account,
    chainId,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
    error,
    status,
  } = useWallet();

  const handleClick = async () => {
    if (isConnected) {
      disconnectWallet();
      return;
    }

    try {
      await connectWallet();
    } catch {
      // The provider exposes the actionable error to the user. The context keeps
      // the error state available for richer UI without throwing into React.
    }
  };

  let label = 'Connect Wallet';
  if (isConnecting) label = 'Connecting…';
  else if (isConnected) label = formatAddress(account);
  else if (status === 'unavailable') label = 'Wallet unavailable';

  const buttonTitle = error
    || (isConnected
      ? `Connected to ${account}${chainId ? ` on chain ${chainId}` : ''}`
      : 'Connect an EVM wallet');

  return (
    <button
      type="button"
      className={`btn gap-2 disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
      onClick={handleClick}
      disabled={isConnecting}
      aria-label={isConnected ? `Wallet ${account}. Disconnect` : 'Connect wallet'}
      title={buttonTitle}
    >
      <FaWallet aria-hidden="true" />
      <span>{label}</span>
      {isConnected && chainId ? (
        <span className="hidden rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold lg:inline">
          {chainId}
        </span>
      ) : null}
    </button>
  );
}

export default WalletButton;
