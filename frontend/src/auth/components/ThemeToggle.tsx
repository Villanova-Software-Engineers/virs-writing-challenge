import React from 'react';
import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="fixed top-4 right-4 z-50 flex size-10 items-center justify-center rounded-xl border border-accent/20 bg-background text-text shadow-md backdrop-blur-xl transition-all hover:shadow-lg focus-visible:outline-2 focus-visible:outline-primary"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      type="button"
    >
      {theme === 'light' ? <HiOutlineMoon size={20} /> : <HiOutlineSun size={20} />}
    </button>
  );
};

export default ThemeToggle;
