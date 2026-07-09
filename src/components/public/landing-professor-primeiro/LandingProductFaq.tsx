import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { ppEyebrow } from "./theme";

const PRODUCT_FAQ_ITEMS = [
  {
    question: "A IA pode errar?",
    answer:
      "Pode, como qualquer IA. Por isso todo conteúdo gerado é sempre revisável e editável no painel antes de usar em sala. Você mantém o controle final sobre o material.",
  },
  {
    question: "Funciona para qualquer disciplina e ano/série?",
    answer:
      "Sim. Você escolhe a etapa, o ano/série e o componente curricular, e o Planify sugere habilidades da BNCC compatíveis, da Educação Infantil ao Ensino Médio.",
  },
  {
    question: "Preciso ter conhecimento técnico para usar?",
    answer:
      "Não. Basta descrever o tema da aula em uma frase. A interface foi pensada para professores, sem jargão técnico nem etapas complicadas.",
  },
  {
    question: "Consigo editar o material antes de usar com a turma?",
    answer:
      "Sim. Todo conteúdo gerado abre no editor do Planify, onde você pode ajustar textos, adicionar exemplos e revisar antes de exportar ou publicar.",
  },
  {
    question: "Meus documentos ficam salvos onde?",
    answer:
      "Os documentos exportados vão direto para o Google Drive e Docs da sua própria conta Google. O Planify não retém cópias dos seus arquivos exportados.",
  },
  {
    question: "O teste na página inicial tem custo ou compromisso?",
    answer:
      "Não. Você pode gerar uma lista de atividades gratuitamente, sem cadastro, uma única vez, com PDF para imprimir, e conhecer a qualidade do material antes de decidir assinar.",
  },
] as const;

export function LandingProductFaq() {
  return (
    <section id="faq" className="scroll-mt-24 bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className={ppEyebrow}>Perguntas frequentes</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold text-[#0A192F] sm:text-4xl">
            Tire suas dúvidas antes de começar
          </h2>
        </div>

        <div className="mt-10 grid gap-3">
          {PRODUCT_FAQ_ITEMS.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 open:border-[#26C6DA]/40 sm:px-6"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-1 text-base font-bold text-[#0A192F] [&::-webkit-details-marker]:hidden">
                {item.question}
                <PlanifyIcon
                  name="chevronDown"
                  className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
