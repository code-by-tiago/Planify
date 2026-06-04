"use client";

import { useId } from "react";

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
 * Coruja Planify — capelo de formatura + livro (mascote da marca).
 */
export function LumiMascot({
  size = 96,
  animated = false,
  withAura = false,
  className = "",
}: LumiMascotProps) {
  const uid = useId().replace(/:/g, "");
  const bodyGrad = `owlBody-${uid}`;
  const bellyGrad = `owlBelly-${uid}`;

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
        aria-label="Coruja Planify com capelo de formatura e livro"
      >
        <defs>
          <linearGradient id={bodyGrad} x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#a5b4fc" />
            <stop offset="45%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id={bellyGrad} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e0e7ff" />
            <stop offset="100%" stopColor="#c7d2fe" />
          </linearGradient>
        </defs>

        {/* Capelo — mais alto e visível */}
        <polygon points="60,0 98,24 22,24" fill="#312e81" />
        <rect x="20" y="20" width="80" height="14" rx="3" fill="#1e1b4b" />
        <rect x="22" y="22" width="76" height="10" rx="2" fill="#4338ca" />
        <line
          x1="94"
          y1="26"
          x2="94"
          y2="42"
          stroke="#fbbf24"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="94" cy="44" r="4" fill="#fbbf24" />
        <circle cx="94" cy="44" r="2" fill="#f59e0b" />

        {/* Orelhas */}
        <ellipse cx="30" cy="42" rx="14" ry="18" fill={`url(#${bodyGrad})`} />
        <ellipse cx="90" cy="42" rx="14" ry="18" fill={`url(#${bodyGrad})`} />

        {/* Cabeça e corpo */}
        <circle cx="60" cy="64" r="38" fill={`url(#${bodyGrad})`} />
        <ellipse cx="60" cy="70" rx="22" ry="26" fill={`url(#${bellyGrad})`} />

        {/* Olhos (sem óculos) */}
        <ellipse cx="44" cy="60" rx="11" ry="13" fill="#fff" />
        <ellipse cx="76" cy="60" rx="11" ry="13" fill="#fff" />
        <circle cx="44" cy="62" r="5.5" fill="#312e81" />
        <circle cx="76" cy="62" r="5.5" fill="#312e81" />
        <circle cx="46" cy="60" r="2" fill="#fff" opacity="0.9" />
        <circle cx="78" cy="60" r="2" fill="#fff" opacity="0.9" />

        {/* Bico */}
        <path d="M60 74 L53 84 L67 84 Z" fill="#f59e0b" />
        <path d="M60 76 L57 82 L63 82 Z" fill="#fbbf24" />

        {/* Livro na mão (asa direita) */}
        <ellipse cx="94" cy="80" rx="11" ry="16" fill="#4f46e5" opacity="0.5" />
        <rect x="82" y="72" width="22" height="26" rx="3" fill="#fef3c7" />
        <rect x="82" y="72" width="5" height="26" rx="2" fill="#b45309" />
        <line x1="90" y1="78" x2="100" y2="78" stroke="#d97706" strokeWidth="1.5" />
        <line x1="90" y1="83" x2="100" y2="83" stroke="#d97706" strokeWidth="1.5" />
        <line x1="90" y1="88" x2="98" y2="88" stroke="#d97706" strokeWidth="1.5" />

        {/* Asa esquerda */}
        <ellipse cx="26" cy="80" rx="12" ry="18" fill="#4f46e5" opacity="0.55" />

        {/* Pés */}
        <ellipse cx="48" cy="100" rx="10" ry="6" fill="#f59e0b" />
        <ellipse cx="72" cy="100" rx="10" ry="6" fill="#f59e0b" />
      </svg>
    </span>
  );
}

export default LumiMascot;
