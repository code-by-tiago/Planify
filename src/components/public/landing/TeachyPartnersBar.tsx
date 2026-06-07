import { teachyTrustSchools } from "@/lib/pro/teachyLanding";

export function TeachyPartnersBar() {
  const items = [...teachyTrustSchools, ...teachyTrustSchools];

  return (
    <section className="pl-hud-partners py-8">
      <p className="text-center text-sm font-semibold text-slate-500">
        Usado por professores em escolas de todo o Brasil
      </p>
      <div className="pl-marquee relative mt-5 overflow-hidden">
        <div className="pl-marquee__track flex gap-8">
          {items.map((label, index) => (
            <span
              key={`${label}-${index}`}
              className="shrink-0 text-sm font-black text-slate-400"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
