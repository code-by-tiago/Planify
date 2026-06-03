"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { LumiMascot } from "@/components/pro/LumiMascot";
import {
  appNavigation,
  planifyTools,
  toolCategories,
} from "@/lib/pro/planifyTools";

type FrameProps = {
  children: ReactNode;
  /** Sobrescreve a detecção automática de rota ativa. */
  active?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  /** Modo compacto: omite o header com título/subtítulo. */
  compact?: boolean;
};

const reduceMotion = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};

export default function PlanifyAppFrame({
  children,
  active,
  title = "Planify Studio",
  subtitle = "Central de criação pedagógica",
  action,
  compact = false,
}: FrameProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTipo, setActiveTipo] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setActiveTipo(new URLSearchParams(window.location.search).get("tipo"));
    }
  }, [pathname]);

  function isNavActive(href: string): boolean {
    if (active) return active === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  function isToolActive(toolId: string): boolean {
    return pathname === "/materiais" && activeTipo === toolId;
  }

  const filteredTools = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return planifyTools;
    return planifyTools.filter(
      (tool) =>
        tool.title.toLowerCase().includes(term) ||
        tool.shortTitle.toLowerCase().includes(term) ||
        tool.description.toLowerCase().includes(term),
    );
  }, [query]);

  const groupedTools = useMemo(
    () =>
      toolCategories
        .filter((category) => category.id !== "todos")
        .map((category) => ({
          category,
          tools: filteredTools.filter((tool) => tool.category === category.id),
        }))
        .filter((group) => group.tools.length > 0),
    [filteredTools],
  );

  const sidebarBody = (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Busca */}
      <div className="px-4 pt-4">
        <div className="relative">
          <PlanifyIcon
            name="search"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar ferramenta..."
            aria-label="Buscar ferramenta"
            className="w-full rounded-2xl border border-indigo-100 bg-white py-2.5 pl-10 pr-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* CTA Criar */}
      <div className="px-4 pt-3">
        <Link
          href="/materiais"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-rose-500 px-4 py-3 text-sm font-black text-white shadow-[0_12px_28px_-12px_rgba(99,102,241,0.7)] transition hover:-translate-y-0.5"
        >
          <PlanifyIcon name="spark" className="h-4 w-4" />
          Criar material
        </Link>
      </div>

      {/* Navegação rolável */}
      <nav className="mt-4 min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-4">
        {/* Workspace */}
        <div>
          <p className="pl-cat-label px-1 text-[11px] font-black uppercase tracking-[0.16em]">
            Workspace
          </p>
          <div className="mt-2 space-y-1">
            {appNavigation.map((item) => {
              const selected = isNavActive(item.href) && pathname !== "/materiais";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  aria-current={selected ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-black transition ${
                    selected
                      ? "pl-nav-active"
                      : "text-slate-600 hover:bg-indigo-50 hover:text-slate-950"
                  }`}
                >
                  <PlanifyIcon name={item.icon} className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Ferramentas por categoria */}
        {groupedTools.map((group) => (
          <div key={group.category.id}>
            <p className="pl-cat-label px-1 text-[11px] font-black uppercase tracking-[0.16em]">
              {group.category.label}
            </p>
            <div className="mt-2 space-y-1">
              {group.tools.map((tool) => {
                const selected = isToolActive(tool.id);
                return (
                  <Link
                    key={tool.id}
                    href={tool.href}
                    onClick={() => setSidebarOpen(false)}
                    aria-current={selected ? "page" : undefined}
                    className={`pl-tool-item group flex items-center gap-3 rounded-2xl border border-transparent px-2.5 py-2 text-sm font-bold transition ${
                      selected
                        ? "border-indigo-200 bg-white shadow-sm"
                        : "text-slate-600"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tool.accent} text-white shadow-sm`}
                    >
                      <PlanifyIcon name={tool.icon} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 truncate">{tool.shortTitle}</span>
                    {tool.popular ? (
                      <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-700">
                        Top
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {groupedTools.length === 0 ? (
          <p className="px-1 text-sm font-semibold text-slate-400">
            Nenhuma ferramenta encontrada.
          </p>
        ) : null}
      </nav>

      {/* Mascote no rodapé */}
      <div className="shrink-0 px-4 pb-4">
        <div className="pl-lumi-card flex items-center gap-3 rounded-3xl p-3.5">
          <LumiMascot size={48} animated />
          <div className="min-w-0">
            <p className="text-sm font-black leading-tight text-slate-950">
              Lumi está com você
            </p>
            <p className="mt-0.5 text-xs font-semibold leading-4 text-slate-500">
              Escolha uma ferramenta e crie em segundos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <main className="planify-ui3 pl-app-bg text-slate-950 lg:h-dvh lg:overflow-hidden">
      <div className="lg:grid lg:h-dvh lg:grid-cols-[288px_1fr]">
        {/* Sidebar — desktop */}
        <aside className="pl-sidebar hidden border-r lg:flex lg:h-dvh lg:flex-col">
          <div className="shrink-0 px-4 pt-5">
            <PlanifyBrand />
          </div>
          {sidebarBody}
        </aside>

        {/* Sidebar — mobile (drawer animado) */}
        <AnimatePresence>
          {sidebarOpen ? (
            <>
              <motion.div
                key="overlay"
                variants={reduceMotion}
                initial="hidden"
                animate="show"
                exit="hidden"
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
              />
              <motion.aside
                key="drawer"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 34 }}
                className="pl-sidebar fixed inset-y-0 left-0 z-50 flex w-[300px] flex-col border-r shadow-2xl lg:hidden"
              >
                <div className="flex shrink-0 items-center justify-between px-4 pt-5">
                  <PlanifyBrand />
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Fechar menu"
                    className="flex h-9 w-9 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-indigo-50"
                  >
                    <PlanifyIcon name="close" className="h-5 w-5" />
                  </button>
                </div>
                {sidebarBody}
              </motion.aside>
            </>
          ) : null}
        </AnimatePresence>

        {/* Conteúdo principal — único elemento que rola no desktop */}
        <section className="flex min-w-0 flex-col lg:h-dvh">
          {compact ? (
            <header className="sticky top-0 z-30 shrink-0 border-b border-indigo-100/70 bg-white/85 px-4 py-3 backdrop-blur lg:hidden">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Abrir menu"
                  className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-600 transition hover:bg-indigo-50"
                >
                  <PlanifyIcon name="menu" className="h-5 w-5" />
                </button>
                <PlanifyBrand compact />
              </div>
            </header>
          ) : (
            <header className="sticky top-0 z-30 shrink-0 border-b border-indigo-100/70 bg-white/85 px-4 py-3 backdrop-blur sm:px-6">
              <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Abrir menu"
                    className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-600 transition hover:bg-indigo-50 lg:hidden"
                  >
                    <PlanifyIcon name="menu" className="h-5 w-5" />
                  </button>
                  <div className="min-w-0">
                    <h1 className="truncate text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                      {title}
                    </h1>
                    <p className="truncate text-sm font-semibold text-slate-500">
                      {subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {action}
                  <Link
                    href="/planos"
                    className="hidden rounded-2xl border border-indigo-100 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-indigo-400 sm:inline-flex"
                  >
                    Planos
                  </Link>
                </div>
              </div>
            </header>
          )}

          <div
            key={pathname}
            className="pl-fade-rise min-w-0 flex-1 lg:min-h-0 lg:overflow-y-auto"
          >
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
