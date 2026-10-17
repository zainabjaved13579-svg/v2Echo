import React, { useState } from 'react';
import { SAPPHIRE_LOGO_URL } from '../data/constants';

interface SapphireBrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  showText?: boolean;
  subtitle?: string;
  className?: string;
  animated?: boolean;
}

export const SapphireBrandLogo: React.FC<SapphireBrandLogoProps> = ({
  size = 'md',
  showText = false,
  subtitle,
  className = '',
  animated = false
}) => {
  const [imgError, setImgError] = useState(false);

  const dimension = typeof size === 'number'
    ? size
    : size === 'xs'
    ? 20
    : size === 'sm'
    ? 26
    : size === 'md'
    ? 34
    : size === 'lg'
    ? 44
    : 56;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        style={{ width: dimension, height: dimension }}
        className={`relative shrink-0 flex items-center justify-center rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ${
          animated ? 'hover:scale-105 active:scale-95 hover:shadow-cyan-500/20' : ''
        }`}
      >
        {!imgError ? (
          <img
            src={SAPPHIRE_LOGO_URL}
            alt="Sapphire Logo"
            onError={() => setImgError(true)}
            className="w-full h-full object-contain select-none drop-shadow-md"
            loading="eager"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs">
            S
          </div>
        )}
      </div>

      {showText && (
        <div className="flex flex-col select-none leading-none">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold tracking-tight text-base sm:text-lg bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
              Sapphire
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
              AI
            </span>
          </div>
          {subtitle && (
            <span className="text-[10px] font-medium text-zinc-400 mt-0.5 tracking-wide">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SapphireBrandLogo;
