import { ppEyebrow } from "./theme";

const STEPS = [
  {
    number: "01",
    title: "Escolha etapa, ano e disciplina",
    description: "Os mesmos campos do painel, para a IA acertar o nível e o componente.",
  },
  {
    number: "02",
    title: "Digite o tema e gere a lista",
    description: "Exercícios variados, alinhados à BNCC, prontos para revisar e imprimir.",
  },
  {
    number: "03",
    title: "Baixe o PDF ou assine",
    description: "Imprima a lista ou assine para remover o rodapé e gerar materiais ilimitados.",
  },
] as const;

export function LandingProcessSteps() {
  return (
    <section id="como-funciona" className="scroll-mt-24 bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <p className={`${ppEyebrow} text-center`}>Como funciona</p>

        <div className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {STEPS.map((step) => (
            <div key={step.number}>
              <p className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-slate-200">
                {step.number}
              </p>
              <h3 className="mt-3 text-lg font-extrabold text-[#0A192F]">{step.title}</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
