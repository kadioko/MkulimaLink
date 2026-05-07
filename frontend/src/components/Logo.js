import React from 'react';
import { useThemeStore } from '../store/themeStore';

export const Logo = ({ size = 40, className = '', showText = false, textClassName = '' }) => {
  const { isDarkMode } = useThemeStore();
  const logoSrc = isDarkMode ? '/logo-dark.svg' : '/logo.svg';
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src={logoSrc} 
        alt="MkulimaLink" 
        width={size} 
        height={size}
        className="rounded-lg"
      />
      {showText && (
        <span className={`font-bold text-xl ${textClassName}`}>
          <span className="text-emerald-600 dark:text-emerald-400">Mkulima</span>
          <span className="text-gray-800 dark:text-gray-200">Link</span>
        </span>
      )}
    </div>
  );
};

export const LogoIcon = ({ size = 24, className = '' }) => {
  const { isDarkMode } = useThemeStore();
  const logoSrc = isDarkMode ? '/logo-dark.svg' : '/logo.svg';
  
  return (
    <img 
      src={logoSrc} 
      alt="MkulimaLink" 
      width={size} 
      height={size}
      className={`rounded ${className}`}
    />
  );
};

export const LoadingLogo = ({ size = 60 }) => {
  const { isDarkMode } = useThemeStore();
  const logoSrc = isDarkMode ? '/logo-dark.svg' : '/logo.svg';
  
  return (
    <div className="relative">
      <img 
        src={logoSrc} 
        alt="MkulimaLink" 
        width={size} 
        height={size}
        className="rounded-xl animate-pulse"
      />
      <div className="absolute inset-0 rounded-xl border-2 border-emerald-500 border-t-transparent animate-spin" 
           style={{ width: size + 8, height: size + 8, margin: -4 }} />
    </div>
  );
};

export default Logo;
