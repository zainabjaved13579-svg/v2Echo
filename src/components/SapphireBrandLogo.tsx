import React from 'react';

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
        className={`relative shrink-0 flex items-center justify-center ${
          animated ? 'transition-transform duration-300 hover:scale-105 active:scale-95' : ''
        }`}
      >
        <svg
          viewBox="0 0 512 512"
          width={dimension}
          height={dimension}
          className="w-full h-full drop-shadow-md select-none"
        >
          <defs>
            {/* Outer Ambient Glow */}
            <radialGradient id="peakAura" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#2563eb" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
            </radialGradient>

            {/* Prism Facet Gradients */}
            <linearGradient id="crestTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="40%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>

            <linearGradient id="crestLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>

            <linearGradient id="crestRight" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>

            <linearGradient id="keystoneCenter" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#93c5fd" />
              <stop offset="70%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <linearGradient id="baseFlankLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#090d16" />
            </linearGradient>

            <linearGradient id="baseFlankRight" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1d4ed8" />
              <stop offset="100%" stopColor="#050811" />
            </linearGradient>

            <linearGradient id="bottomSpire" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            {/* Inner Radiant Core Spark (Sapphire Intellect) */}
            <radialGradient id="quantumPulsar" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#fed7aa" />
              <stop offset="70%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#d97757" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Subtle Energy Disk */}
          <circle cx="256" cy="256" r="236" fill="url(#peakAura)" />

          {/* Hexagonal Isometric Geometry */}
          {/* Top Crown Facet */}
          <polygon points="256,60 380,132 256,204 132,132" fill="url(#crestTop)" />

          {/* Upper Left Facet */}
          <polygon points="132,132 256,204 220,310 96,238" fill="url(#crestLeft)" />

          {/* Upper Right Facet */}
          <polygon points="380,132 416,238 292,310 256,204" fill="url(#crestRight)" />

          {/* Central Keystone Diamond Prism */}
          <polygon points="256,204 292,310 256,380 220,310" fill="url(#keystoneCenter)" />

          {/* Bottom Left Triangular Flank */}
          <polygon points="96,238 220,310 256,380 256,452 96,238" fill="url(#baseFlankLeft)" opacity="0.95" />

          {/* Bottom Right Triangular Flank */}
          <polygon points="416,238 292,310 256,380 256,452 416,238" fill="url(#baseFlankRight)" opacity="0.95" />

          {/* Lower Spire Prism Blade */}
          <polygon points="220,310 256,380 256,452" fill="url(#bottomSpire)" opacity="0.85" />
          <polygon points="292,310 256,380 256,452" fill="#38bdf8" opacity="0.6" />

          {/* Precision Crystal Facet Edge Accents */}
          <line x1="256" y1="60" x2="256" y2="204" stroke="#ffffff" strokeWidth="3" strokeOpacity="0.8" strokeLinecap="round" />
          <line x1="132" y1="132" x2="256" y2="204" stroke="#ffffff" strokeWidth="2.5" strokeOpacity="0.6" />
          <line x1="380" y1="132" x2="256" y2="204" stroke="#ffffff" strokeWidth="2.5" strokeOpacity="0.6" />
          <line x1="256" y1="204" x2="256" y2="452" stroke="#67e8f9" strokeWidth="2.5" strokeOpacity="0.75" />
          <line x1="220" y1="310" x2="292" y2="310" stroke="#bae6fd" strokeWidth="2" strokeOpacity="0.5" />

          {/* Integrated Modern Code Chevrons '< / >' */}
          <polyline
            points="188,235 158,260 188,285"
            stroke="#93c5fd"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <polyline
            points="324,235 354,260 324,285"
            stroke="#38bdf8"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Radiant Core Star (Sapphire Heart) */}
          <circle cx="256" cy="270" r="38" fill="url(#quantumPulsar)" />
          <circle cx="256" cy="270" r="10" fill="#ffffff" />
          <polygon points="256,245 261,265 281,270 261,275 256,295 251,275 231,270 251,265" fill="#ffedd5" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-extrabold text-sm sm:text-base tracking-tight bg-gradient-to-r from-blue-400 via-sky-300 to-amber-300 bg-clip-text text-transparent">
              Sapphire
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-300 uppercase tracking-widest">
              AI
            </span>
          </div>
          {subtitle && (
            <span className="text-[10px] text-zinc-400 font-medium tracking-normal mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SapphireBrandLogo;
