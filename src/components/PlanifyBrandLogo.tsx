export function PlanifyBrandLogo() {
  return (
    <div className="planify-brand-logo flex items-center gap-3">
      <div className="planify-brand-logo__icon" aria-hidden="true">
        <svg viewBox="0 0 64 64" role="img" className="h-full w-full" focusable="false">
          <defs>
            <linearGradient id="planifyLogoGradient" x1="8" y1="7" x2="56" y2="57">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="45%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
            <linearGradient id="planifyCapGradient" x1="14" y1="7" x2="53" y2="27">
              <stop offset="0%" stopColor="#111827" />
              <stop offset="55%" stopColor="#312E81" />
              <stop offset="100%" stopColor="#0E7490" />
            </linearGradient>
            <filter id="planifyLogoShadow" x="-24%" y="-24%" width="148%" height="148%">
              <feDropShadow dx="0" dy="10" stdDeviation="6" floodColor="#1E1B4B" floodOpacity="0.16" />
            </filter>
          </defs>

          <rect
            x="7"
            y="10"
            width="50"
            height="47"
            rx="17"
            fill="url(#planifyLogoGradient)"
            filter="url(#planifyLogoShadow)"
          />

          <g className="planify-logo-cap">
            <path
              d="M13.5 15.5 32 6.9l18.5 8.6L32 24.1 13.5 15.5Z"
              fill="url(#planifyCapGradient)"
            />
            <path
              d="M21.1 20.2v5.6c0 2.8 4.9 5.1 10.9 5.1s10.9-2.3 10.9-5.1v-5.6L32 25.2 21.1 20.2Z"
              fill="#1E1B4B"
              opacity="0.98"
            />
            <path
              d="M49.7 16.2v12.4"
              stroke="#F59E0B"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <circle cx="49.7" cy="31" r="2.4" fill="#FBBF24" />
          </g>

          <path
            d="M19.8 23.2h17.3c7.8 0 13.1 4.7 13.1 11.8 0 7.3-5.3 12.1-13.1 12.1H29v7h-9.2V23.2Z"
            fill="#FFFFFF"
            opacity="0.98"
          />

          <path
            d="M29 31v8.4h7.5c3.1 0 5-1.6 5-4.3 0-2.6-1.9-4.1-5-4.1H29Z"
            fill="#4F46E5"
            opacity="0.82"
          />

          <circle cx="45" cy="48" r="8.5" fill="#ECFEFF" />
          <path
            d="M41.1 47.8l2.6 2.6 5.4-5.9"
            fill="none"
            stroke="#0891B2"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="planify-brand-logo__text">
        <span className="planify-brand-logo__name">Planify</span>
        <span className="planify-brand-logo__tagline">Plataforma educacional premium</span>
      </div>
    </div>
  );
}

export default PlanifyBrandLogo;
