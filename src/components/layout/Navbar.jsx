import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import ThemeToggle from './ThemeToggle';
import WalletButton from '../wallet/WalletButton';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Properties', href: '/properties' },
    { name: 'About', href: '/about' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Blog', href: '/blog' },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-secondary-100 bg-white/95 shadow-sm backdrop-blur transition-colors dark:border-secondary-800 dark:bg-secondary-950/95">
      <div className="container">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <Link to="/" className="flex items-center" aria-label="RentVerse home">
              <svg width="30" height="35" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="15" cy="20" r="10" stroke="#0682ff" />
                <circle cx="15" cy="20" r="6" stroke="#0682ff" strokeWidth="3" />
              </svg>
              <span className="mt-1.5 text-2xl font-bold text-primary-600">RentVerse</span>
            </Link>
          </div>

          <div className="hidden items-center space-x-3 md:flex">
            <div className="flex items-center space-x-5 lg:space-x-7">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="px-2 py-2 text-sm font-medium text-secondary-600 transition-colors hover:text-primary-600 dark:text-secondary-300 dark:hover:text-primary-400"
                >
                  {item.name}
                </Link>
              ))}
            </div>
            <ThemeToggle />
            <WalletButton />
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-secondary-600 hover:bg-secondary-50 hover:text-primary-600 dark:text-secondary-300 dark:hover:bg-secondary-800 dark:hover:text-primary-400"
              onClick={() => setIsOpen((current) => !current)}
              aria-expanded={isOpen}
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="border-t border-secondary-100 pb-4 pt-2 dark:border-secondary-800 md:hidden">
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block rounded-md px-3 py-2 text-base font-medium text-secondary-600 hover:bg-primary-50 hover:text-primary-600 dark:text-secondary-300 dark:hover:bg-secondary-800 dark:hover:text-primary-400"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <WalletButton className="mt-3 w-full justify-center" />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
