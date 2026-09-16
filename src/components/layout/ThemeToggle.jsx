import { FiMoon, FiSun } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-md border border-secondary-200 bg-white text-secondary-700 transition-colors hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-100 dark:hover:bg-secondary-800 dark:focus:ring-offset-secondary-950 ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? <FiSun size={19} /> : <FiMoon size={19} />}
    </button>
  );
}

export default ThemeToggle;
