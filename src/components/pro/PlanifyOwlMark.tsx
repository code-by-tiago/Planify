import Image from "next/image";

type PlanifyOwlMarkProps = {
  size?: number;
  glow?: boolean;
  className?: string;
  priority?: boolean;
};

/** Realistic black owl with graduation cap — HUD circular frame */
export function PlanifyOwlMark({
  size = 48,
  glow = true,
  className = "",
  priority = false,
}: PlanifyOwlMarkProps) {
  const inner = Math.max(size - 8, 24);

  return (
    <span
      className={`pl-hud-owl-ring shrink-0 ${glow ? "pl-hud-owl-ring--glow" : ""} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Image
        src="/brand/planify-owl-graduate.png"
        alt=""
        width={inner}
        height={inner}
        priority={priority}
        className="h-[calc(100%-8px)] w-[calc(100%-8px)] rounded-full object-cover"
      />
    </span>
  );
}

export default PlanifyOwlMark;
