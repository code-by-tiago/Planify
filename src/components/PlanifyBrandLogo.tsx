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
            <filter id="planifyLogoShadow" x="-24%" y="-24%" width="148%" height="148%">
              <feDropShadow dx="0" dy="10" stdDeviation="6" floodColor="#1E1B4B" floodOpacity="0.16" />
            </filter>
          </defs>

          <rect
            x="7"
            y="7"
            width="50"
            height="50"
            rx="18"
            fill="url(#planifyLogoGradient)"
            filter="url(#planifyLogoShadow)"
          />

          <path
            d="M19.8 18.4h17.3c7.8 0 13.1 4.8 13.1 12 0 7.3-5.3 12.2-13.1 12.2H29v8.5h-9.2V18.4Z"
            fill="#FFFFFF"
            opacity="0.98"
          />

          <path
            d="M29 26.2v9h7.5c3.1 0 5-1.7 5-4.6 0-2.8-1.9-4.4-5-4.4H29Z"
            fill="#4F46E5"
            opacity="0.82"
          />

          <circle cx="45" cy="46" r="9.3" fill="#ECFEFF" />
          <path
            d="M40.9 45.8l2.8 2.8 5.8-6.3"
            fill="none"
            stroke="#0891B2"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="planify-brand-logo__text">
        <span className="planify-brand-logo__name">Planify</span>
        <span className="planify-brand-logo__tagline">SaaS educacional premium</span>
      </div>
    </div>
  );
}

export default PlanifyBrandLogo;
