import { teachyPartnerLabels } from "@/lib/pro/teachyLanding";

export function TeachyPartnersBar() {
  const items = [...teachyPartnerLabels, ...teachyPartnerLabels];

  return (
    <section className="pl-hud-partners py-8">
      <p className="text-center text-sm font-semibold text-slate-500">
        Integrações e recursos disponíveis na plataforma
      </p>
      <div className="pl-marquee relative mt-5 overflow-hidden">
        <div className="pl-marquee__track flex gap-10">
          {items.map((label, index) => (
            <span
              key={`${label}-${index}`}
              className="shrink-0 text-sm font-black tracking-wide text-slate-400"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
