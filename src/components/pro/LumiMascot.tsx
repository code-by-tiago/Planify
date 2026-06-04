"use client";

import { useId } from "react";

type LumiMascotProps = {
  /** Tamanho do lado (px). Default: 96 */
  size?: number;
  animated?: boolean;
  withAura?: boolean;
  className?: string;
  priority?: boolean;
};

/**
 * Coruja Planify — silhueta de coruja real (disco facial, tufos, capelo e livro).
 */
export function LumiMascot({
  size = 96,
  animated = false,
  withAura = false,
  className = "",
}: LumiMascotProps) {
  const uid = useId().replace(/:/g, "");
  const featherGrad = `owlFeather-${uid}`;
  const bellyGrad = `owlBelly-${uid}`;
  const diskGrad = `owlDisk-${uid}`;

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
        className="h-full w-full drop-shadow-[0_6px_16px_rgba(79,70,229,0.32)]"
        role="img"
        aria-label="Coruja Planify com capelo de formatura e livro"
      >
        <defs>
          <linearGradient id={featherGrad} x1="30%" y1="0%" x2="70%" y2="100%">
            <stop offset="0%" stopColor="#7c83f6" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4338ca" />
          </linearGradient>
          <linearGradient id={bellyGrad} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#eef2ff" />
            <stop offset="100%" stopColor="#c7d2fe" />
          </linearGradient>
          <radialGradient id={diskGrad} cx="50%" cy="42%" r="52%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="55%" stopColor="#e0e7ff" />
            <stop offset="100%" stopColor="#a5b4fc" />
          </radialGradient>
        </defs>

        {/* Capelo (sobre os tufos) */}
        <polygon points="60,2 94,22 26,22" fill="#1e1b4b" />
        <rect x="24" y="18" width="72" height="11" rx="2.5" fill="#312e81" />
        <rect x="26" y="20" width="68" height="7" rx="2" fill="#4f46e5" />
        <path
          d="M90 21 v14"
          stroke="#fbbf24"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="90" cy="37" r="3.5" fill="#fbbf24" />

        {/* Tufos auriculares (marca de coruja) */}
        <path
          d="M34 28 L28 8 L42 22 Z"
          fill={`url(#${featherGrad})`}
          stroke="#312e81"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path
          d="M86 28 L92 8 L78 22 Z"
          fill={`url(#${featherGrad})`}
          stroke="#312e81"
          strokeWidth="1"
          strokeLinejoin="round"
        />

        {/* Corpo e asas */}
        <ellipse cx="60" cy="88" rx="34" ry="26" fill={`url(#${featherGrad})`} />
        <ellipse cx="60" cy="90" rx="20" ry="16" fill={`url(#${bellyGrad})`} />
        <path
          d="M18 78 Q8 88 14 102 Q22 94 26 82 Z"
          fill="#4f46e5"
          opacity="0.85"
        />
        <path
          d="M102 78 Q112 88 106 102 Q98 94 94 82 Z"
          fill="#4f46e5"
          opacity="0.85"
        />

        {/* Disco facial (formato típico de coruja) */}
        <path
          d="M60 30
             C38 30 24 44 24 58
             C24 74 38 86 60 86
             C82 86 96 74 96 58
             C96 44 82 30 60 30 Z"
          fill={`url(#${diskGrad})`}
          stroke="#4338ca"
          strokeWidth="2"
        />
        <path
          d="M60 36 C44 36 32 48 32 58 C32 68 44 78 60 78 C76 78 88 68 88 58 C88 48 76 36 60 36 Z"
          fill="none"
          stroke="#818cf8"
          strokeWidth="1.2"
          opacity="0.65"
        />

        {/* Olhos grandes e frontais */}
        <circle cx="46" cy="56" r="13" fill="#fff" />
        <circle cx="74" cy="56" r="13" fill="#fff" />
        <circle cx="46" cy="57" r="9" fill="#f59e0b" />
        <circle cx="74" cy="57" r="9" fill="#f59e0b" />
        <circle cx="46" cy="58" r="5" fill="#1e1b4b" />
        <circle cx="74" cy="58" r="5" fill="#1e1b4b" />
        <circle cx="48" cy="55" r="2" fill="#fff" opacity="0.95" />
        <circle cx="76" cy="55" r="2" fill="#fff" opacity="0.95" />

        {/* Bico curvo de coruja */}
        <path d="M60 64 L54 74 Q60 78 66 74 Z" fill="#d97706" />
        <path d="M60 66 L57 72 Q60 74 63 72 Z" fill="#fbbf24" />

        {/* Sobrancelhas / padrão de penas */}
        <path
          d="M34 48 Q46 42 52 50"
          fill="none"
          stroke="#4338ca"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M86 48 Q74 42 68 50"
          fill="none"
          stroke="#4338ca"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Livro (garra direita) */}
        <rect x="88" y="84" width="18" height="22" rx="2.5" fill="#fef3c7" />
        <rect x="88" y="84" width="4.5" height="22" rx="1.5" fill="#92400e" />
        <line x1="95" y1="90" x2="102" y2="90" stroke="#b45309" strokeWidth="1.2" />
        <line x1="95" y1="95" x2="102" y2="95" stroke="#b45309" strokeWidth="1.2" />
        <line x1="95" y1="100" x2="100" y2="100" stroke="#b45309" strokeWidth="1.2" />

        {/* Pés com garras */}
        <g fill="#d97706">
          <ellipse cx="46" cy="108" rx="9" ry="5" />
          <ellipse cx="74" cy="108" rx="9" ry="5" />
          <path d="M40 110 L38 116 M46 111 L46 117 M52 110 L54 116" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M68 110 L66 116 M74 111 L74 117 M80 110 L82 116" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      </svg>
    </span>
  );
}

export default LumiMascot;
