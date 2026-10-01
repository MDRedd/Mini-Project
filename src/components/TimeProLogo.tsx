import React from 'react';

interface TimeProLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  showMotto?: boolean;
  layout?: 'horizontal' | 'vertical' | 'icon-only';
  theme?: 'light' | 'dark';
  className?: string;
}

export function TimeProIcon({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-sm transition-transform duration-300 group-hover:scale-105 ${className}`}
    >
      <defs>
        {/* Calendar Body Gradient */}
        <linearGradient id="timepro_cal_grad" x1="15" y1="20" x2="100" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="25%" stopColor="#3B82F6" />
          <stop offset="70%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>

        {/* Graduation Cap Gradient */}
        <linearGradient id="timepro_cap_grad" x1="10" y1="10" x2="60" y2="45" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="50%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#090D16" />
        </linearGradient>

        {/* Clock Badge Gradient */}
        <linearGradient id="timepro_clock_grad" x1="65" y1="55" x2="115" y2="115" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="50%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>

        {/* Inner Card Face Gradient */}
        <linearGradient id="timepro_face_grad" x1="30" y1="40" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F1F5F9" />
        </linearGradient>

        {/* Drop Shadows */}
        <filter id="timepro_shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#3B82F6" floodOpacity="0.25" />
        </filter>
        <filter id="timepro_clock_shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#4F46E5" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Main Calendar Body Frame */}
      <rect
        x="24"
        y="28"
        width="70"
        height="66"
        rx="18"
        fill="url(#timepro_cal_grad)"
        filter="url(#timepro_shadow)"
      />

      {/* Calendar Binder Ring Clip on right */}
      <rect x="74" y="22" width="7" height="14" rx="3.5" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="1.5" />

      {/* White Inner Schedule Card Face */}
      <rect
        x="30"
        y="42"
        width="58"
        height="46"
        rx="12"
        fill="url(#timepro_face_grad)"
      />

      {/* Timetable Grid Cells */}
      <rect x="37" y="48" width="9" height="8" rx="2.5" fill="#93C5FD" />
      <rect x="49" y="48" width="9" height="8" rx="2.5" fill="#A5B4FC" />
      <rect x="37" y="59" width="9" height="8" rx="2.5" fill="#A5B4FC" />
      <rect x="49" y="59" width="9" height="8" rx="2.5" fill="#C7D2FE" />
      <rect x="37" y="70" width="9" height="8" rx="2.5" fill="#C7D2FE" />
      <rect x="49" y="70" width="9" height="8" rx="2.5" fill="#E0E7FF" />

      {/* Graduation Cap on Top-Left */}
      <g>
        {/* Diamond Top Cap Board */}
        <polygon
          points="36,12 62,23 36,34 10,23"
          fill="url(#timepro_cap_grad)"
          stroke="#38BDF8"
          strokeWidth="1.2"
        />
        {/* Cap Skull Base */}
        <path
          d="M20,27.5 Q36,36 52,27.5 L52,33 Q36,41 20,33 Z"
          fill="#0F172A"
          stroke="#1E293B"
          strokeWidth="1"
        />
        {/* Tassel String & Hanging Pendant */}
        <path
          d="M36,23 Q16,26 14,40"
          stroke="#60A5FA"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="14" cy="42" r="2.5" fill="#38BDF8" />
      </g>

      {/* Overlaid Clock Emblem on Bottom-Right */}
      <g filter="url(#timepro_clock_shadow)">
        <circle
          cx="84"
          cy="82"
          r="22"
          fill="url(#timepro_clock_grad)"
          stroke="#FFFFFF"
          strokeWidth="3.5"
        />
        {/* Inner Clock Face */}
        <circle cx="84" cy="82" r="16.5" fill="#FFFFFF" />
        {/* Clock Hands indicating 3:00 / schedule time */}
        <circle cx="84" cy="82" r="2" fill="#4F46E5" />
        <path
          d="M84,72 L84,82 L92,82"
          stroke="#4F46E5"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export default function TimeProLogo({
  size = 'md',
  showSubtitle = true,
  showMotto = false,
  layout = 'horizontal',
  theme = 'light',
  className = '',
}: TimeProLogoProps) {
  const iconSizes = {
    sm: 32,
    md: 42,
    lg: 56,
    xl: 72,
  };

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl sm:text-4xl',
    xl: 'text-4xl sm:text-5xl',
  };

  const subSizes = {
    sm: 'text-[8.5px] tracking-[0.16em]',
    md: 'text-[9.5px] sm:text-[10px] tracking-[0.2em]',
    lg: 'text-xs tracking-[0.22em]',
    xl: 'text-sm tracking-[0.24em]',
  };

  if (layout === 'icon-only') {
    return <TimeProIcon size={iconSizes[size]} className={className} />;
  }

  if (layout === 'vertical') {
    return (
      <div className={`flex flex-col items-center text-center group ${className}`}>
        <TimeProIcon size={iconSizes[size]} />
        <div className="mt-2.5">
          <div className={`${titleSizes[size]} font-black tracking-tight leading-none`}>
            <span className={theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}>Time</span>
            <span className="bg-gradient-to-r from-[#2563EB] via-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent font-black ml-0.5">
              Pro
            </span>
          </div>
          {showSubtitle && (
            <p className={`mt-1.5 font-bold uppercase ${subSizes[size]} ${theme === 'dark' ? 'text-slate-300' : 'text-[#475569]'}`}>
              TIMETABLE MANAGEMENT SYSTEM
            </p>
          )}
          {showMotto && (
            <p className="mt-1 text-[9px] tracking-widest text-[#94A3B8] uppercase font-semibold">
              — PLAN • ORGANIZE • EMPOWER —
            </p>
          )}
        </div>
      </div>
    );
  }

  // Horizontal Layout
  return (
    <div className={`flex items-center gap-3 group select-none ${className}`}>
      <TimeProIcon size={iconSizes[size]} />
      <div className="flex flex-col justify-center">
        <div className={`${titleSizes[size]} font-black tracking-tight leading-none flex items-center`}>
          <span className={theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}>Time</span>
          <span className="bg-gradient-to-r from-[#2563EB] via-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent font-black ml-0.5">
            Pro
          </span>
        </div>
        {showSubtitle && (
          <p className={`mt-1 font-bold uppercase ${subSizes[size]} ${theme === 'dark' ? 'text-slate-300' : 'text-[#475569]'}`}>
            TIMETABLE MANAGEMENT SYSTEM
          </p>
        )}
      </div>
    </div>
  );
}
