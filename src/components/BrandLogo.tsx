import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showWordmark = true,
  className = '',
}) => {
  const iconDimensions = {
    sm: { width: 22, height: 22 },
    md: { width: 28, height: 28 },
    lg: { width: 38, height: 38 },
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* GentleArrow307 Silver Liquid-Glass Arrow Icon */}
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{
          width: iconDimensions.width,
          height: iconDimensions.height,
        }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_2px_8px_rgba(255,255,255,0.12)]"
        >
          <defs>
            {/* Outer Liquid Silver Gradient */}
            <linearGradient id="silverGlossGrad" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="25%" stopColor="#e2e8f0" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#94a3b8" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#475569" stopOpacity="0.9" />
            </linearGradient>

            {/* Inner Dark Glass Gradient */}
            <linearGradient id="innerGlassGrad" x1="30" y1="20" x2="70" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#27272a" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#09090b" stopOpacity="0.95" />
            </linearGradient>

            {/* Specular Ray Highlight */}
            <linearGradient id="specularRay" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            {/* Arrow Facet Top */}
            <linearGradient id="facetTop" x1="50" y1="15" x2="85" y2="50" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>

            {/* Arrow Facet Bottom */}
            <linearGradient id="facetBottom" x1="50" y1="50" x2="20" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>

          {/* Liquid Glass Pill Base Plate */}
          <rect
            x="8"
            y="8"
            width="84"
            height="84"
            rx="24"
            fill="url(#innerGlassGrad)"
            stroke="url(#silverGlossGrad)"
            strokeWidth="2.5"
          />

          {/* Liquid glass specular arc */}
          <path
            d="M 18 36 C 24 22, 42 16, 68 18"
            stroke="url(#specularRay)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Precision Forward Arrow Geometric Facets */}
          {/* Main Arrow Stem & Tip */}
          <path
            d="M 50 24 L 74 48 L 50 72 L 50 56 L 26 56 L 26 40 L 50 40 Z"
            fill="url(#silverGlossGrad)"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Facet Light Refraction */}
          <path
            d="M 50 24 L 74 48 L 50 48 Z"
            fill="url(#facetTop)"
            opacity="0.9"
          />

          {/* Inner Core Refraction */}
          <path
            d="M 28 42 L 50 42 L 50 48 L 28 48 Z"
            fill="#ffffff"
            opacity="0.25"
          />

          {/* Trailing Soft Accent Dots (Local-First Precision) */}
          <circle cx="20" cy="48" r="2.2" fill="#e2e8f0" opacity="0.8" />
        </svg>
      </div>

      {/* Wordmark */}
      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-semibold tracking-tight text-white ${
                size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'
              }`}
            >
              GentleArrow<span className="text-slate-400 font-mono text-[0.88em]">307</span>
            </span>
          </div>
          {size !== 'sm' && (
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mt-0.5">
              Private AI Workspace
            </span>
          )}
        </div>
      )}
    </div>
  );
};
