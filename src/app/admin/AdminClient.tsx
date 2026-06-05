"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type AdminTab =
  | "visao-geral"
  | "usuarios"
  | "assinaturas"
  | "biblioteca"
  | "marketplace"
  | "documentos"
  | "sistema";

type UserStatus = "Ativo" | "Pendente" | "Sem plano" | "Bloqueado";
type SubscriptionStatus = "Ativa" | "Pendente" | "Vencida" | "Cancelada";
type ReviewStatus = "Aprovado" | "Pendente" | "Destacado" | "Revisar";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: UserStatus;
  documents: number;
  joinedAt: string;
};

type AdminSubscription = {
  id: string;
  customer: string;
  plan: string;
  status: SubscriptionStatus;
  value: string;
  renewal: string;
};

type AdminContent = {
  id: string;
  title: string;
  area: "Biblioteca" | "Marketplace" | "Documentos";
  owner: string;
  category: string;
  status: ReviewStatus;
  downloads: number;
};

type SystemCheck = {
  name: string;
  status: "Configurado" | "Pendente" | "Preparado";
  description: string;
};

const tabs: Array<{ id: AdminTab; label: string }> = [
  { id: "visao-geral", label: "Visão geral" },
  { id: "usuarios", label: "Usuários" },
  { id: "assinaturas", label: "Assinaturas" },
  { id: "biblioteca", label: "Biblioteca" },
  { id: "marketplace", label: "Marketplace" },
  { id: "documentos", label: "Documentos" },
  { id: "sistema", label: "Sistema" },
];

const users: AdminUser[] = [
  {
    id: "usr-001",
    name: "Ana Ribeiro",
    email: "ana@escola.com",
    plan: "Professor Pro Mensal",
    status: "Ativo",
    documents: 18,
    joinedAt: "Hoje",
  },
  {
    id: "usr-002",
    name: "Marcos Lima",
    email: "marcos@escola.com",
    plan: "Professor Pro Anual",
    status: "Ativo",
    documents: 42,
    joinedAt: "Esta semana",
  },
  {
    id: "usr-003",
    name: "Carla Mendes",
    email: "carla@escola.com",
    plan: "Sem assinatura",
    status: "Sem plano",
    documents: 0,
    joinedAt: "Ontem",
  },
  {
    id: "usr-004",
    name: "Daniel Costa",
    email: "daniel@escola.com",
    plan: "Professor Pro Mensal",
    status: "Pendente",
    documents: 5,
    joinedAt: "Este mês",
  },
];

const subscriptions: AdminSubscription[] = [
  {
    id: "sub-001",
    customer: "Ana Ribeiro",
    plan: "Professor Pro Mensal",
    status: "Ativa",
    value: "R$ 49,90",
    renewal: "Próximo mês",
  },
  {
    id: "sub-002",
    customer: "Marcos Lima",
    plan: "Professor Pro Anual",
    status: "Ativa",
    value: "R$ 479,90",
    renewal: "Próximo ano",
  },
  {
    id: "sub-003",
    customer: "Daniel Costa",
    plan: "Professor Pro Mensal",
    status: "Pendente",
    value: "R$ 49,90",
    renewal: "Aguardando Stripe",
  },
];

const contents: AdminContent[] = [
  {
    id: "cnt-001",
    title: "Modelo de planejamento anual por habilidades",
    area: "Biblioteca",
    owner: "Admin Planify",
    category: "Planejamento",
    status: "Destacado",
    downloads: 312,
  },
  {
    id: "cnt-002",
    title: "Sequência didática de leitura e interpretação",
    area: "Marketplace",
    owner: "Ana Ribeiro",
    category: "Sequência didática",
    status: "Aprovado",
    downloads: 248,
  },
  {
    id: "cnt-003",
    title: "Atividade de frações equivalentes",
    area: "Marketplace",
    owner: "Marcos Lima",
    category: "Atividade",
    status: "Pendente",
    downloads: 181,
  },
  {
    id: "cnt-004",
    title: "Planejamento anual de Língua Portuguesa",
    area: "Documentos",
    owner: "Ana Ribeiro",
    category: "Planejamento",
    status: "Revisar",
    downloads: 0,
  },
];

const systemChecks: SystemCheck[] = [
  {
    name: "Supabase Auth",
    status: "Preparado",
    description: "Cliente, sessão e proteção premium preparados.",
  },
  {
    name: "Banco Supabase",
    status: "Preparado",
    description: "SQL, RLS e tabelas principais estruturados.",
  },
  {
    name: "Stripe",
    status: "Preparado",
    description: "Checkout e webhook preparados com variáveis de ambiente.",
  },
  {
    name: "BNCC Oficial",
    status: "Configurado",
    description: "Base processada instalada com habilidades EF e EM.",
  },
  {
    name: "IA",
    status: "Pendente",
    description: "Será ligado depois da estrutura visual das páginas internas.",
  },
  {
    name: "DOCX",
    status: "Pendente",
    description: "Será ligado aos modelos oficiais anual e trimestral.",
  },
];

const metrics = [
  { label: "Usuários", value: "4", detail: "base visual" },
  { label: "Assinaturas ativas", value: "2", detail: "Stripe preparado" },
  { label: "Materiais", value: "4", detail: "curadoria e comunidade" },
  { label: "BNCC", value: "1.487", detail: "habilidades processadas" },
];

function getStatusClass(status: string) {
  if (
    status === "Ativo" ||
    status === "Ativa" ||
    status === "Aprovado" ||
    status === "Configurado"
  ) {
    return "border-emerald-300/30 bg-emerald-300/10 text-emerald-100";
  }

  if (status === "Destacado" || status === "Preparado") {
    return "border-cyan-300/30 bg-cyan-300/10 text-cyan-100";
  }

  if (status === "Pendente" || status === "Sem plano" || status === "Vencida" || status === "Revisar") {
    return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  }

  return "border-rose-300/30 bg-rose-300/10 text-rose-100";
}

function isContentTab(tab: AdminTab, area: AdminContent["area"]) {
  if (tab === "biblioteca") {
    return area === "Biblioteca";
  }

  if (tab === "marketplace") {
    return area === "Marketplace";
  }

  if (tab === "documentos") {
    return area === "Documentos";
  }

  return false;
}

export function AdminClient() {
  const [activeTab, setActiveTab] = useState<AdminTab>("visao-geral");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<AdminContent | null>(contents[0] ?? null);

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();

    return users.filter((user) => {
      if (!term) {
        return true;
      }

      return [user.name, user.email, user.plan, user.status]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [query]);

  const filteredSubscriptions = useMemo(() => {
    const term = query.trim().toLowerCase();

    return subscriptions.filter((subscription) => {
      if (!term) {
        return true;
      }

      return [subscription.customer, subscription.plan, subscription.status]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [query]);

  const filteredContents = useMemo(() => {
    const term = query.trim().toLowerCase();

    return contents.filter((content) => {
      const tabMatch =
        activeTab === "visao-geral" ||
        activeTab === "sistema" ||
        isContentTab(activeTab, content.area);

      if (!tabMatch) {
        return false;
      }

      if (!term) {
        return true;
      }

      return [content.title, content.area, content.owner, content.category, content.status]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [activeTab, query]);

  function handlePreparedAction(action: string, target: string) {
    setMessage(`${action} preparado para "${target}". A ação real será conectada ao Supabase em etapa futura.`);
  }

  function renderOverview() {
    return (
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-5"
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                {metric.label}
              </p>
              <p className="mt-3 text-3xl font-black text-white">{metric.value}</p>
              <p className="mt-2 text-xs font-bold text-cyan-200">{metric.detail}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
              Prioridades
            </p>
            <h2 className="mt-3 text-2xl font-black text-white">Próximas áreas de gestão</h2>

            <div className="mt-6 grid gap-3">
              {[
                ["Biblioteca", "Cadastrar materiais oficiais e destacar conteúdos premium."],
                ["Marketplace", "Moderar publicações dos professores e aprovar anexos."],
                ["Assinaturas", "Acompanhar plano ativo, vencido, pendente e cancelado."],
                ["Documentos", "Auditar uso, histórico e geração de arquivos."],
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-sm font-black text-white">{title}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
              Saúde do sistema
            </p>
            <h2 className="mt-3 text-2xl font-black text-white">Integrações</h2>

            <div className="mt-6 grid gap-3">
              {systemChecks.slice(0, 4).map((item) => (
                <div key={item.name} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-black text-white">{item.name}</p>
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderUsers() {
    return (
      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <article key={user.id} className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(user.status)}`}>
                    {user.status}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-300">
                    {user.plan}
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-black text-white">{user.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{user.email}</p>

                <div className="mt-4 grid gap-3 text-sm text-slate-400 sm:grid-cols-2">
                  <p>
                    <span className="font-black text-white">Documentos:</span> {user.documents}
                  </p>
                  <p>
                    <span className="font-black text-white">Entrada:</span> {user.joinedAt}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:w-44">
                <button
                  type="button"
                  onClick={() => handlePreparedAction("Gestão de usuário", user.name)}
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-cyan-100"
                >
                  Gerenciar
                </button>
                <button
                  type="button"
                  onClick={() => handlePreparedAction("Bloqueio/reativação", user.name)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10"
                >
                  Status
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  }

  function renderSubscriptions() {
    return (
      <div className="grid gap-4">
        {filteredSubscriptions.map((subscription) => (
          <article key={subscription.id} className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(subscription.status)}`}>
                    {subscription.status}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-300">
                    {subscription.value}
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-black text-white">{subscription.customer}</h3>
                <p className="mt-1 text-sm text-slate-400">{subscription.plan}</p>

                <p className="mt-4 text-sm text-slate-400">
                  <span className="font-black text-white">Renovação:</span> {subscription.renewal}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handlePreparedAction("Consulta Stripe", subscription.customer)}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-cyan-100 lg:w-44"
              >
                Ver Stripe
              </button>
            </div>
          </article>
        ))}
      </div>
    );
  }

  function renderContents() {
    return (
      <div className="grid gap-6">
        {selectedContent && (
          <div className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-6">
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
                  Selecionado
                </p>
                <h2 className="mt-3 text-2xl font-black text-white">{selectedContent.title}</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-950">
                    {selectedContent.area}
                  </span>
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(selectedContent.status)}`}>
                    {selectedContent.status}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-cyan-100">
                    {selectedContent.category}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:w-44">
                <button
                  type="button"
                  onClick={() => handlePreparedAction("Aprovação", selectedContent.title)}
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-cyan-100"
                >
                  Aprovar
                </button>
                <button
                  type="button"
                  onClick={() => handlePreparedAction("Destaque", selectedContent.title)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10"
                >
                  Destacar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {filteredContents.map((content) => (
            <article
              key={content.id}
              className={`rounded-[1.5rem] border p-5 transition hover:-translate-y-1 ${
                selectedContent?.id === content.id
                  ? "border-cyan-300/40 bg-cyan-300/10"
                  : "border-white/10 bg-slate-950/50 hover:border-cyan-300/30"
              }`}
            >
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                <button type="button" onClick={() => setSelectedContent(content)} className="text-left">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-950">
                      {content.area}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(content.status)}`}>
                      {content.status}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-300">
                      {content.category}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-black text-white">{content.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Dono: {content.owner} • Downloads: {content.downloads}
                  </p>
                </button>

                <div className="flex flex-col gap-3 lg:w-44">
                  <button
                    type="button"
                    onClick={() => handlePreparedAction("Moderação", content.title)}
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-cyan-100"
                  >
                    Moderar
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePreparedAction("Remoção", content.title)}
                    className="rounded-2xl border border-rose-300/30 bg-rose-300/10 px-5 py-3 text-sm font-black text-rose-100 transition hover:-translate-y-1 hover:bg-rose-300/20"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    );
  }

  function renderSystem() {
    return (
      <div className="grid gap-4">
        {systemChecks.map((item) => (
          <article key={item.name} className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-xl font-black text-white">{item.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
              </div>

              <span className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(item.status)}`}>
                {item.status}
              </span>
            </div>
          </article>
        ))}
      </div>
    );
  }

  function renderCurrentTab() {
    if (activeTab === "visao-geral") {
      return renderOverview();
    }

    if (activeTab === "usuarios") {
      return renderUsers();
    }

    if (activeTab === "assinaturas") {
      return renderSubscriptions();
    }

    if (activeTab === "sistema") {
      return renderSystem();
    }

    return renderContents();
  }

  return (
    <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <aside className="grid gap-6 xl:sticky xl:top-28 xl:h-fit">
          <div className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-6 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
              Dono do SaaS
            </p>
            <h2 className="mt-3 text-3xl font-black text-white">
              Controle geral do Planify.
            </h2>
            <p className="mt-4 text-sm leading-7 text-cyan-100/85">
              Esta área concentra a gestão visual de usuários, assinaturas, materiais, biblioteca, marketplace e documentos.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/dashboard"
                className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-cyan-100"
              >
                Ir ao dashboard
              </Link>
              <Link
                href="/contato"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10"
              >
                Ver contato
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur-2xl">
            <div className="grid gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMessage(null);
                  }}
                  className={`rounded-2xl px-4 py-3 text-left text-sm font-black transition ${
                    activeTab === tab.id
                      ? "bg-white text-slate-950"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="grid gap-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
                  Gestão
                </p>
                <h2 className="mt-3 text-3xl font-black text-white">
                  {tabs.find((tab) => tab.id === activeTab)?.label}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                  Painel visual preparado para receber dados reais do Supabase, Stripe e Storage nas próximas etapas.
                </p>
              </div>

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar no painel"
                className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 lg:w-72"
              />
            </div>

            {message && (
              <div className="mt-6 rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-4 text-sm font-bold text-cyan-100">
                {message}
              </div>
            )}
          </div>

          {renderCurrentTab()}
        </div>
      </div>
    </section>
  );
}
