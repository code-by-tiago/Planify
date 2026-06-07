import { PlanifyOwlMark } from "@/components/pro/PlanifyOwlMark";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

const nodes = [
  { id: "science", icon: "layers" as const, x: 12, y: 18 },
  { id: "literacy", icon: "book" as const, x: 82, y: 14 },
  { id: "digital", icon: "presentation" as const, x: 88, y: 62 },
  { id: "writing", icon: "pen" as const, x: 10, y: 68 },
];

/** HUD AR overlay — owl central + ícones conectados por circuitos */
export function PlanifyHudHeroVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-lg">
      <div className="pl-hud-hero-photo" aria-hidden />

      <svg
        className="pl-hud-circuit absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        aria-hidden
      >
        <path d="M 22 24 L 38 38 L 50 42" />
        <path d="M 78 20 L 64 36 L 52 42" />
        <path d="M 82 66 L 66 54 L 52 58" />
        <path d="M 18 72 L 36 58 L 48 56" />
        <circle cx="38" cy="38" r="1.2" fill="#00d4ff" />
        <circle cx="64" cy="36" r="1.2" fill="#00d4ff" />
        <circle cx="66" cy="54" r="1.2" fill="#00d4ff" />
        <circle cx="36" cy="58" r="1.2" fill="#00d4ff" />
        <circle cx="50" cy="50" r="34" fill="none" stroke="rgba(0,212,255,0.2)" strokeWidth="0.5" strokeDasharray="3 2" />
        <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(0,212,255,0.35)" strokeWidth="0.8" strokeDasharray="4 3" />
      </svg>

      <div className="absolute left-1/2 top-[46%] z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
        <PlanifyOwlMark size={172} glow hero priority />
        <span className="mt-4 rounded-full border border-cyan-400/30 bg-white/85 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-700 backdrop-blur-sm shadow-sm">
          IA · BNCC
        </span>
      </div>

      {nodes.map((node) => (
        <div
          key={node.id}
          className="pl-hud-node absolute flex items-center justify-center"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            transform: "translate(-50%, -50%)",
            width: "3.25rem",
            height: "3.25rem",
          }}
        >
          <PlanifyIcon name={node.icon} className="h-4 w-4" />
        </div>
      ))}
    </div>
  );
}

export default PlanifyHudHeroVisual;
