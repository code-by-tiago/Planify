import Image from "next/image";

type PlanifyOwlMarkProps = {
  size?: number;
  glow?: boolean;
  hero?: boolean;
  className?: string;
  priority?: boolean;
};

/** Cute intellectual owl — glasses, book, graduation cap · HUD ring */
export function PlanifyOwlMark({
  size = 48,
  glow = true,
  hero = false,
  className = "",
  priority = false,
}: PlanifyOwlMarkProps) {
  const padding = hero ? 10 : 6;
  const imageSize = Math.max(size - padding * 2, 28);

  return (
    <span
      className={[
        "pl-hud-owl-ring shrink-0",
        glow ? "pl-hud-owl-ring--glow" : "",
        hero ? "pl-hud-owl-ring--hero" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Image
        src="/brand/planify-owl-graduate.png"
        alt=""
        width={imageSize}
        height={imageSize}
        priority={priority}
        className="pl-hud-owl-image relative z-[1] rounded-full"
      />
    </span>
  );
}

export default PlanifyOwlMark;
