type LumiMascotProps = {
  /** Tamanho do lado (px). Default: 96 */
  size?: number;
  /** Flutuação suave (respeita prefers-reduced-motion). */
  animated?: boolean;
  /** Aura quente atrás do mascote. */
  withAura?: boolean;
  className?: string;
  /** Mantido por compatibilidade (SVG inline). */
  priority?: boolean;
};

/**
 * Coruja Planify — óculos + capelo de formatura (mascote da marca).
 */
export function LumiMascot({
  size = 96,
  animated = false,
  withAura = false,
  className = "",
}: LumiMascotProps) {
  return (
    <span
      className={[
        "relative inline-flex shrink-0 items-center justify-center",
        withAura ? "pl-lumi-aura" : "",
        animated ? "pl-bob" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox="0 0 120 120"
        width={size}
        height={size}
        className="h-full w-full drop-shadow-[0_8px_20px_rgba(99,102,241,0.28)]"
        role="img"
        aria-label="Coruja Planify com óculos e capelo"
      >
        <defs>
          <linearGradient id="owlBody" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#a5b4fc" />
            <stop offset="45%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="owlBelly" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e0e7ff" />
            <stop offset="100%" stopColor="#c7d2fe" />
          </linearGradient>
        </defs>

        {/* Capelo */}
        <rect x="28" y="8" width="64" height="10" rx="2" fill="#312e81" />
        <polygon points="60,2 88,18 32,18" fill="#4338ca" />
        <circle cx="88" cy="14" r="3" fill="#fbbf24" />

        {/* Orelhas/tufos */}
        <ellipse cx="32" cy="38" rx="14" ry="18" fill="url(#owlBody)" />
        <ellipse cx="88" cy="38" rx="14" ry="18" fill="url(#owlBody)" />
        <ellipse cx="32" cy="40" rx="8" ry="10" fill="#4f46e5" opacity="0.35" />
        <ellipse cx="88" cy="40" rx="8" ry="10" fill="#4f46e5" opacity="0.35" />

        {/* Corpo / cabeça */}
        <circle cx="60" cy="62" r="38" fill="url(#owlBody)" />
        <ellipse cx="60" cy="68" rx="22" ry="26" fill="url(#owlBelly)" />

        {/* Óculos */}
        <rect x="30" y="52" width="24" height="20" rx="8" fill="#1e1b4b" opacity="0.9" />
        <rect x="66" y="52" width="24" height="20" rx="8" fill="#1e1b4b" opacity="0.9" />
        <path
          d="M54 62 H66"
          stroke="#1e1b4b"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="42" cy="62" r="7" fill="#fef08a" />
        <circle cx="78" cy="62" r="7" fill="#fef08a" />
        <circle cx="42" cy="62" r="3.5" fill="#1e1b4b" />
        <circle cx="78" cy="62" r="3.5" fill="#1e1b4b" />
        <path
          d="M36 54 L48 54 M72 54 L84 54"
          stroke="#6366f1"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Bico */}
        <path d="M60 72 L54 82 L66 82 Z" fill="#f59e0b" />
        <path d="M60 74 L57 80 L63 80 Z" fill="#fbbf24" />

        {/* Asas */}
        <ellipse cx="28" cy="78" rx="12" ry="18" fill="#4f46e5" opacity="0.55" />
        <ellipse cx="92" cy="78" rx="12" ry="18" fill="#4f46e5" opacity="0.55" />

        {/* Pés */}
        <ellipse cx="48" cy="98" rx="10" ry="6" fill="#f59e0b" />
        <ellipse cx="72" cy="98" rx="10" ry="6" fill="#f59e0b" />
      </svg>
    </span>
  );
}

export default LumiMascot;
