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
    <section className="relative isolate overflow-hidden bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Construa o futuro do ensino em conjunto
          </h2>
          <p className="mt-4 text-lg font-medium leading-8 text-slate-600">
            Colabore com educadoras e acesse materiais da comunidade Planify —
            publique o que você cria e reutilize modelos alinhados à BNCC.
          </p>
          <Link
            href="/dashboard?secao=marketplace"
            className="pl-teachy-cta mt-8 inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold"
          >
            Abrir Marketplace
            <PlanifyIcon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sampleMaterials.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 transition hover:border-blue-200 hover:bg-white hover:shadow-md"
            >
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${item.color}`}
              >
                {item.tag}
              </span>
              <p className="mt-3 text-sm font-black leading-snug text-slate-900">
                {item.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
