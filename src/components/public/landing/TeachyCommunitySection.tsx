import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

const sampleMaterials = [
  { title: "Atividade: Biomas brasileiros", tag: "Jogo", color: "bg-emerald-100 text-emerald-800" },
  { title: "Slides: Estados da matéria", tag: "Slides", color: "bg-blue-100 text-blue-800" },
  { title: "Prova: Revolução Industrial", tag: "Prova", color: "bg-violet-100 text-violet-800" },
  { title: "Mapa mental: Fotossíntese", tag: "Mapa", color: "bg-fuchsia-100 text-fuchsia-800" },
  { title: "Lista: Funções do 1º grau", tag: "Lista", color: "bg-cyan-100 text-cyan-800" },
  { title: "Plano: Gêneros textuais", tag: "Plano", color: "bg-amber-100 text-amber-800" },
];

export function TeachyCommunitySection() {
  return (
    <section className="pl-hud-band-wrap relative isolate overflow-hidden py-16 sm:py-20">
      <div className="pl-hud-glass-band mx-auto max-w-[calc(100%-2rem)] sm:max-w-7xl">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/80">
              Comunidade Planify
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Construa o futuro do ensino em conjunto
            </h2>
            <p className="mt-4 text-lg font-medium leading-8 text-cyan-100/80">
              Colabore com educadoras e acesse materiais da comunidade Planify —
              publique o que você cria e reutilize modelos alinhados à BNCC.
            </p>
            <Link
              href="/dashboard?secao=marketplace"
              className="pl-hud-btn mt-8 inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold"
            >
              Abrir Comunidade
              <PlanifyIcon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sampleMaterials.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-cyan-400/15 bg-white/5 p-4 backdrop-blur-sm transition hover:border-cyan-400/30 hover:bg-white/8 hover:shadow-md"
              >
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${item.color}`}
                >
                  {item.tag}
                </span>
                <p className="mt-3 text-sm font-black leading-snug text-cyan-50">
                  {item.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
