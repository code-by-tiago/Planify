import Link from "next/link";
import { PlanifyBrandLogo } from "../components/PlanifyBrandLogo";

export const dynamic = "force-static";

const heroTitle = "Planeje, crie e edite aulas com padrão profissional.";
const heroLead =
  "O Planify ajuda professores a gerar planejamentos oficiais, materiais didáticos, documentos editáveis, biblioteca premium e marketplace em uma experiência simples e organizada.";

const features = [
  {
    title: "Planejamentos oficiais",
    text: "Anual e trimestral com BNCC, conteúdos e modelos DOCX oficiais.",
    href: "/planejamentos",
    label: "Planejar",
  },
  {
    title: "Materiais com IA",
    text: "Atividades, avaliações, jogos, apostilas e recursos editáveis.",
    href: "/materiais",
    label: "Criar",
  },
  {
    title: "Editor completo",
    text: "Texto, tabelas, imagens, formatação, ABNT e versões salvas.",
    href: "/editor",
    label: "Editar",
  },
  {
    title: "Biblioteca Premium",
    text: "Acervo selecionado com materiais prontos para professores.",
    href: "/biblioteca",
    label: "Abrir biblioteca",
  },
  {
    title: "Marketplace",
    text: "Espaço para troca de materiais entre professores da plataforma.",
    href: "/marketplace",
    label: "Abrir marketplace",
  },
];

const benefits = [
  "Menos tempo montando documentos",
  "Mais organização pedagógica",
  "Planejamentos coerentes por trimestre",
  "Materiais editáveis e reutilizáveis",
];

const workflow = [
  {
    title: "Preencha os dados",
    text: "Informe etapa, turma, componente, conteúdos e carga horária.",
  },
  {
    title: "Escolha as habilidades",
    text: "Use sugestões compatíveis com etapa, área e componente.",
  },
  {
    title: "Gere o documento",
    text: "Baixe o DOCX oficial ou abra no editor para ajustes finais.",
  },
  {
    title: "Organize e reutilize",
    text: "Salve materiais, acesse biblioteca e explore o marketplace.",
  },
];

const testimonials = [
  {
    name: "Professor de Linguagens",
    text: "O fluxo anual e trimestral fica mais claro, e o documento final sai pronto para revisar.",
  },
  {
    name: "Coordenação pedagógica",
    text: "A padronização ajuda a manter qualidade, coerência e organização entre turmas.",
  },
  {
    name: "Professor dos anos finais",
    text: "A biblioteca e o editor deixam o trabalho mais rápido sem perder controle do material.",
  },
];

const faqs = [
  {
    question: "O Planify substitui o professor?",
    answer:
      "Não. Ele acelera a produção e organização, mas o professor continua revisando, escolhendo e adaptando tudo.",
  },
  {
    question: "O planejamento usa modelo oficial?",
    answer:
      "Sim. A geração preserva o fluxo dos modelos oficiais configurados no projeto.",
  },
  {
    question: "Posso editar depois de gerar?",
    answer:
      "Sim. O documento pode ser aberto no editor para ajustes de texto, tabelas, imagens e formatação.",
  },
  {
    question: "O acesso premium libera as áreas internas?",
    answer:
      "Sim. As áreas principais ficam protegidas e são liberadas conforme o acesso da conta.",
  },
];

export default function HomePage() {
  return (
    <main className="planify-landing planify-landing--compact planify-landing--conversion">
      <header className="planify-public-header">
        <Link href="/" className="planify-header-brand" aria-label="Planify inicio">
          <PlanifyBrandLogo />
        </Link>

        <nav className="planify-header-nav" aria-label="Navegacao principal">
          <Link href="/planos">Planos</Link>
          <Link href="/contato">Contato</Link>
          <Link href="/login">Entrar</Link>
        </nav>

        <div className="planify-header-actions">
          <Link href="/login" className="planify-btn planify-btn--ghost">
            Entrar
          </Link>
          <Link href="/dashboard" className="planify-btn planify-btn--primary">
            Acessar painel
          </Link>
        </div>
      </header>

      <section className="planify-hero planify-hero--compact planify-hero--conversion">
        <div className="planify-hero__content">
          <div className="planify-pill">
            <span className="planify-pill__dot" />
            IA educacional para professores
          </div>

          <h1>{heroTitle}</h1>

          <p className="planify-hero__lead">{heroLead}</p>

          <div className="planify-hero__actions">
            <Link href="/planos" className="planify-btn planify-btn--primary planify-btn--large">
              Começar agora
            </Link>
            <Link href="/dashboard" className="planify-btn planify-btn--secondary planify-btn--large">
              Acessar painel
            </Link>
          </div>

          <div className="planify-hero__proof planify-hero__proof--compact">
            <span>DOCX oficial</span>
            <span>BNCC por conteúdo</span>
            <span>Editor avançado</span>
            <span>Biblioteca premium</span>
            <span>Marketplace</span>
          </div>
        </div>

        <div className="planify-hero__media" aria-label="Previa visual da plataforma Planify">
          <div className="planify-video-card planify-video-card--compact">
            <div className="planify-video-card__topbar">
              <span />
              <span />
              <span />
              <strong>Planify Studio</strong>
            </div>

            <div className="planify-video-frame">
              <video
                className="planify-video-frame__video"
                autoPlay
                muted
                loop
                playsInline
                poster="/images/planify-hero-poster.svg"
              >
                <source src="/videos/planify-hero.mp4" type="video/mp4" />
              </video>

              <div className="planify-video-frame__fallback">
                <div className="planify-classroom">
                  <div className="planify-board">
                    <span>BNCC + conteúdo</span>
                    <strong>Planejamento pronto</strong>
                    <small>Anual, trimestral e editável</small>
                  </div>

                  <div className="planify-teacher-card">
                    <div className="planify-avatar">P</div>
                    <div>
                      <strong>Documento oficial</strong>
                      <span>pronto para revisar e baixar</span>
                    </div>
                  </div>

                  <div className="planify-ai-card">
                    <span className="planify-ai-card__spark">✦</span>
                    <div>
                      <strong>IA pedagógica</strong>
                      <span>objetivos, aulas e habilidades alinhadas</span>
                    </div>
                  </div>
                </div>
              </div>

              <button className="planify-play" type="button" aria-label="Previa visual">
                ▶
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="planify-benefit-strip">
        {benefits.map((benefit) => (
          <span key={benefit}>✓ {benefit}</span>
        ))}
      </section>

      <section className="planify-section planify-section--compact">
        <div className="planify-section__header planify-section__header--compact">
          <span>Ferramentas principais</span>
          <h2>Tudo conectado para ganhar tempo e manter qualidade.</h2>
        </div>

        <div className="planify-feature-grid planify-feature-grid--compact planify-feature-grid--five">
          {features.map((feature) => (
            <article className="planify-feature-card planify-feature-card--compact" key={feature.title}>
              <div className="planify-feature-card__icon">✦</div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
              <Link href={feature.href}>{feature.label} →</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="planify-conversion-section planify-how-section">
        <div className="planify-conversion-heading">
          <span>Como funciona</span>
          <h2>Um fluxo simples do planejamento ao material final.</h2>
          <p>
            O Planify organiza o processo para que o professor tenha velocidade,
            consistência e liberdade para revisar tudo antes de usar.
          </p>
        </div>

        <div className="planify-how-grid">
          {workflow.map((item, index) => (
            <article className="planify-how-card" key={item.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="planify-conversion-section planify-security-section">
        <div>
          <span className="planify-kicker">Segurança e acesso premium</span>
          <h2>Profissional por fora. Seguro por dentro.</h2>
          <p>
            As áreas internas são protegidas por login e acesso premium. A experiência
            do professor fica limpa, sem termos técnicos ou mensagens de bastidor.
          </p>
        </div>

        <div className="planify-security-grid">
          <span>Acesso protegido</span>
          <span>Assinatura segura</span>
          <span>Conteúdos premium</span>
          <span>Documentos editáveis</span>
        </div>
      </section>

      <section className="planify-conversion-section">
        <div className="planify-conversion-heading">
          <span>Validação pedagógica</span>
          <h2>Feito para rotina real de professores.</h2>
        </div>

        <div className="planify-testimonial-grid">
          {testimonials.map((item) => (
            <article className="planify-testimonial-card" key={item.name}>
              <p>“{item.text}”</p>
              <strong>{item.name}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="planify-conversion-section planify-faq-section">
        <div className="planify-conversion-heading">
          <span>Dúvidas frequentes</span>
          <h2>Antes de começar.</h2>
        </div>

        <div className="planify-faq-grid">
          {faqs.map((item) => (
            <details className="planify-faq-item" key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="planify-final-cta planify-final-cta--compact planify-final-cta--conversion">
        <span>Planify Premium</span>
        <h2>Transforme sua rotina pedagógica em uma experiência organizada.</h2>
        <p>
          Comece pelos planos, acesse as áreas premium e produza documentos com
          padrão profissional.
        </p>
        <div>
          <Link href="/planos" className="planify-btn planify-btn--primary planify-btn--large">
            Ver planos
          </Link>
          <Link href="/login" className="planify-btn planify-btn--secondary planify-btn--large">
            Entrar
          </Link>
        </div>
      </section>
    </main>
  );
}
