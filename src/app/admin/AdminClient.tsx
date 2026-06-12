"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminQualidadePanel } from "./AdminQualidadePanel";

type AdminTab =
  | "visao-geral"
  | "qualidade-ia"
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
  { id: "qualidade-ia", label: "Qualidade IA" },
  { id: "usuarios", label: "Usuários" },
  { id: "assinaturas", label: "Assinaturas" },
  { id: "biblioteca", label: "Biblioteca" },
  { id: "marketplace", label: "Comunidade" },
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
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "Destacado" || status === "Preparado") {
    return "border-indigo-200 bg-indigo-50 text-indigo-700";
  }

  if (status === "Pendente" || status === "Sem plano" || status === "Vencida" || status === "Revisar") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
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
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                {metric.label}
              </p>
              <p className="mt-3 text-3xl font-black text-slate-950">{metric.value}</p>
              <p className="mt-2 text-xs font-bold text-indigo-700">{metric.detail}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-indigo-600">
              Prioridades
            </p>
            <h2 className="mt-3 text-xl font-black text-slate-950">Próximas áreas de gestão</h2>

            <div className="mt-6 grid gap-3">
              {[
                ["Biblioteca", "Cadastrar materiais oficiais e destacar conteúdos premium."],
                ["Comunidade", "Moderar publicações dos professores e aprovar anexos."],
                ["Assinaturas", "Acompanhar plano ativo, vencido, pendente e cancelado."],
                ["Documentos", "Auditar uso, histórico e geração de arquivos."],
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-black text-slate-950">{title}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-indigo-600">
              Saúde do sistema
            </p>
            <h2 className="mt-3 text-xl font-black text-slate-950">Integrações</h2>

            <div className="mt-6 grid gap-3">
              {systemChecks.slice(0, 4).map((item) => (
                <div key={item.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-black text-slate-950">{item.name}</p>
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{item.description}</p>
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
          <article key={user.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(user.status)}`}>
                    {user.status}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">
                    {user.plan}
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-black text-slate-950">{user.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{user.email}</p>

                <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <p>
                    <span className="font-black text-slate-950">Documentos:</span> {user.documents}
                  </p>
                  <p>
                    <span className="font-black text-slate-950">Entrada:</span> {user.joinedAt}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:w-44">
                <button
                  type="button"
                  onClick={() => handlePreparedAction("Gestão de usuário", user.name)}
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:opacity-95"
                >
                  Gerenciar
                </button>
                <button
                  type="button"
                  onClick={() => handlePreparedAction("Bloqueio/reativação", user.name)}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:-translate-y-1 hover:border-indigo-300"
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
          <article key={subscription.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(subscription.status)}`}>
                    {subscription.status}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">
                    {subscription.value}
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-black text-slate-950">{subscription.customer}</h3>
                <p className="mt-1 text-sm text-slate-600">{subscription.plan}</p>

                <p className="mt-4 text-sm text-slate-600">
                  <span className="font-black text-slate-950">Renovação:</span> {subscription.renewal}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handlePreparedAction("Consulta Stripe", subscription.customer)}
                className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-1 hover:opacity-95 lg:w-44"
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
          <div className="rounded-[2rem] border border-indigo-200 bg-indigo-50/80 p-6">
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-indigo-600">
                  Selecionado
                </p>
                <h2 className="mt-3 text-xl font-black text-slate-950">{selectedContent.title}</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-950">
                    {selectedContent.area}
                  </span>
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(selectedContent.status)}`}>
                    {selectedContent.status}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">
                    {selectedContent.category}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:w-44">
                <button
                  type="button"
                  onClick={() => handlePreparedAction("Aprovação", selectedContent.title)}
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:opacity-95"
                >
                  Aprovar
                </button>
                <button
                  type="button"
                  onClick={() => handlePreparedAction("Destaque", selectedContent.title)}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:-translate-y-1 hover:border-indigo-300"
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
                  ? "border-indigo-400 bg-indigo-50"
                  : "border-slate-200 bg-white hover:border-indigo-300"
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
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">
                      {content.category}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-black text-slate-950">{content.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Dono: {content.owner} • Downloads: {content.downloads}
                  </p>
                </button>

                <div className="flex flex-col gap-3 lg:w-44">
                  <button
                    type="button"
                    onClick={() => handlePreparedAction("Moderação", content.title)}
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:opacity-95"
                  >
                    Moderar
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePreparedAction("Remoção", content.title)}
                    className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-black text-rose-700 transition hover:-translate-y-1"
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
          <article key={item.name} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-950">{item.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
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

    if (activeTab === "qualidade-ia") {
      return <AdminQualidadePanel />;
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
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-indigo-700">
              Dono do SaaS
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">
              Controle geral do Planify.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Esta área concentra a gestão visual de usuários, assinaturas, materiais, biblioteca, marketplace e documentos.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/dashboard"
                className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 text-center text-sm font-black text-white transition hover:-translate-y-1 hover:opacity-95"
              >
                Ir ao dashboard
              </Link>
              <Link
                href="/contato"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-sm font-black text-slate-700 transition hover:-translate-y-1 hover:border-indigo-300"
              >
                Ver contato
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-2xl backdrop-blur-2xl">
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
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                      : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="grid gap-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl backdrop-blur-2xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-indigo-600">
                  Gestão
                </p>
                <h2 className="mt-3 text-3xl font-black text-slate-950">
                  {tabs.find((tab) => tab.id === activeTab)?.label}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  Painel visual preparado para receber dados reais do Supabase, Stripe e Storage nas próximas etapas.
                </p>
              </div>

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar no painel"
                className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white lg:w-72"
              />
            </div>

            {message && (
              <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm font-bold text-indigo-800">
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
