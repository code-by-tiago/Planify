import Image from "next/image";

type LumiMascotProps = {
  /** Tamanho do lado (px). Default: 96 */
  size?: number;
  /** Flutuação suave (respeita prefers-reduced-motion). */
  animated?: boolean;
  /** Aura quente atrás do mascote (bom para estados vazios/loading). */
  withAura?: boolean;
  className?: string;
  /** Prioriza o carregamento (use em above-the-fold). */
  priority?: boolean;
};

/**
 * Lumi — mascote do Planify (raposinha com capelo).
 * Asset em /public/lumi-mascot.png. Usado na marca, estados vazios,
 * loading "mágico" e onboarding para dar alma à experiência.
 */
export function LumiMascot({
  size = 96,
  animated = false,
  withAura = false,
  className = "",
  priority = false,
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
    >
      <Image
        src="/lumi-mascot.png"
        alt="Lumi, mascote do Planify"
        width={size}
        height={size}
        priority={priority}
        className="h-full w-full object-contain drop-shadow-[0_10px_18px_rgba(244,63,94,0.22)]"
      />
    </span>
  );
}

export default LumiMascot;
