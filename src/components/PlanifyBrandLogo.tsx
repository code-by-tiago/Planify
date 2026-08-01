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
            <linearGradient id="planifyCapGradient" x1="20" y1="4" x2="58" y2="24">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="52%" stopColor="#312E81" />
              <stop offset="100%" stopColor="#0891B2" />
            </linearGradient>
            <filter id="planifyLogoShadow" x="-24%" y="-24%" width="148%" height="148%">
              <feDropShadow dx="0" dy="10" stdDeviation="6" floodColor="#1E1B4B" floodOpacity="0.18" />
            </filter>
            <filter id="planifyCapShadow" x="-20%" y="-20%" width="140%" height="150%">
              <feDropShadow dx="0" dy="4" stdDeviation="2" floodColor="#020617" floodOpacity="0.32" />
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

          <path
            d="M18.9 23.4h18.2c8.1 0 13.6 4.8 13.6 12.1 0 7.5-5.5 12.4-13.6 12.4h-8.4v6.5h-9.8v-31Z"
            fill="#FFFFFF"
            opacity="0.99"
          />

          <path
            d="M28.7 31.1v8.7h7.9c3.2 0 5.1-1.7 5.1-4.5 0-2.7-1.9-4.2-5.1-4.2h-7.9Z"
            fill="#4F46E5"
            opacity="0.84"
          />

          <g className="planify-logo-cap" filter="url(#planifyCapShadow)">
            <path
              d="M22.8 14.2 40.1 5.7l17.4 8.5-17.4 8.4-17.3-8.4Z"
              fill="url(#planifyCapGradient)"
              stroke="#E0F2FE"
              strokeWidth="1.35"
              strokeLinejoin="round"
            />
            <path
              d="M30.6 19.1v5.1c0 2.7 4.3 4.9 9.5 4.9 5.3 0 9.6-2.2 9.6-4.9v-5.1l-9.6 4.6-9.5-4.6Z"
              fill="#1E1B4B"
              stroke="#67E8F9"
              strokeWidth="0.85"
              opacity="0.98"
            />
            <path
              d="M55.2 15.4v13.1"
              stroke="#F59E0B"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <circle cx="55.2" cy="31.1" r="2.8" fill="#FBBF24" stroke="#FEF3C7" strokeWidth="0.8" />
          </g>

          <circle cx="45" cy="48" r="8.4" fill="#ECFEFF" />
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
