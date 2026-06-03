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
  type PlanifyIconName,
} from "@/lib/pro/planifyTools";

type FrameProps = {
  children: ReactNode;
  active?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  compact?: boolean;
};

const reduceMotion = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};

const navIconTone: Record<string, string> = {
  home: "from-violet-400 to-fuchsia-500",
  materials: "from-indigo-400 to-violet-500",
  clipboard: "from-emerald-400 to-teal-500",
  editor: "from-rose-400 to-pink-500",
  history: "from-amber-400 to-orange-400",
  library: "from-sky-400 to-indigo-400",
  market: "from-fuchsia-400 to-rose-500",
  plans: "from-violet-500 to-indigo-600",
};

function NavIcon({ name }: { name: PlanifyIconName }) {
  const tone = navIconTone[name] ?? "from-indigo-400 to-violet-500";
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-[0_4px_12px_-4px_rgba(139,92,246,0.45)] ring-2 ring-white/80`}
    >
      <PlanifyIcon name={name} className="h-4 w-4" />
    </span>
  );
}

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

  const isDashboard = pathname === "/dashboard";

  const pageMeta = useMemo(() => {
    if (pathname === "/dashboard") {
      return { title: "Studio", subtitle: "Sua central de criação" };
    }
    if (pathname.startsWith("/materiais")) {
      return { title: "Materiais", subtitle: "Ferramentas com IA" };
    }
    if (pathname.startsWith("/planejamentos")) {
      return { title: "Planejamentos", subtitle: "BNCC + DOCX oficial" };
    }
    if (pathname.startsWith("/editor")) {
      return { title: "Editor", subtitle: "Finalize e exporte" };
    }
    if (pathname.startsWith("/historico")) {
      return { title: "Histórico", subtitle: "Tudo que você criou" };
    }
    if (pathname.startsWith("/biblioteca")) {
      return { title: "Biblioteca", subtitle: "Seus materiais salvos" };
    }
    if (pathname.startsWith("/marketplace")) {
      return { title: "Marketplace", subtitle: "Recursos da comunidade" };
    }
    return { title, subtitle };
  }, [pathname, title, subtitle]);

  const sidebarScroll = (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3">
      <div className="relative pt-4">
        <PlanifyIcon
          name="search"
          className="pointer-events-none absolute left-3.5 top-[calc(1rem+0.625rem)] h-4 w-4 -translate-y-1/2 text-violet-300"
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar ferramenta..."
          aria-label="Buscar ferramenta"
          className="w-full rounded-2xl border border-rose-100/80 bg-white/90 py-2.5 pl-10 pr-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-violet-300 focus:border-fuchsia-300 focus:ring-4 focus:ring-fuchsia-100"
        />
      </div>

      <div className="pt-3">
        <Link
          href="/materiais"
          onClick={() => setSidebarOpen(false)}
          className="pl-btn-primary w-full justify-center rounded-2xl py-3"
        >
          <PlanifyIcon name="spark" className="h-4 w-4" />
          Criar material
        </Link>
      </div>

      <nav className="mt-5 space-y-5 pb-2">
        <div>
          <p className="pl-cat-label px-1 text-[10px] font-black uppercase tracking-[0.2em]">
            Workspace
          </p>
          <div className="mt-2 space-y-1">
            {appNavigation.map((item) => {
              const selected =
                isNavActive(item.href) && pathname !== "/materiais";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  aria-current={selected ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-2xl px-2.5 py-2 text-sm font-bold transition ${
                    selected
                      ? "pl-nav-active shadow-md"
                      : "text-violet-700/90 hover:bg-white/70 hover:text-violet-950"
                  }`}
                >
                  <NavIcon name={item.icon} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {groupedTools.map((group) => (
          <div key={group.category.id}>
            <p className="pl-cat-label px-1 text-[10px] font-black uppercase tracking-[0.2em]">
              {group.category.label}
            </p>
            <div className="mt-2 space-y-0.5">
              {group.tools.map((tool) => {
                const selected = isToolActive(tool.id);
                return (
                  <Link
                    key={tool.id}
                    href={tool.href}
                    onClick={() => setSidebarOpen(false)}
                    aria-current={selected ? "page" : undefined}
                    className={`pl-tool-item group flex items-center gap-2.5 rounded-2xl border px-2 py-1.5 text-sm font-bold transition ${
                      selected
                        ? "border-fuchsia-200/80 bg-white shadow-[0_6px_20px_-10px_rgba(236,72,153,0.35)]"
                        : "border-transparent text-violet-700/85"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tool.accent} text-white shadow-[0_4px_10px_-4px_rgba(139,92,246,0.4)] ring-2 ring-white/70 transition group-hover:scale-105`}
                    >
                      <PlanifyIcon name={tool.icon} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 truncate">{tool.shortTitle}</span>
                    {tool.popular ? (
                      <span className="ml-auto shrink-0 rounded-full bg-gradient-to-r from-amber-100 to-orange-50 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-amber-700">
                        ✦
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {groupedTools.length === 0 ? (
          <p className="px-1 text-sm font-semibold text-violet-300">
            Nenhuma ferramenta encontrada.
          </p>
        ) : null}
      </nav>
    </div>
  );

  const sidebarChrome = (
    <>
      <div className="shrink-0 border-b border-rose-100/50 px-4 py-4">
        <PlanifyBrand />
        <p className="mt-2 text-[11px] font-bold leading-snug text-violet-400">
          Pronta para encantar sua turma?
        </p>
      </div>
      {sidebarScroll}
      <div className="shrink-0 border-t border-rose-100/40 px-4 py-3">
        <div className="pl-lumi-card flex items-center gap-3 rounded-2xl p-3">
          <LumiMascot size={44} animated withAura />
          <div className="min-w-0">
            <p className="text-xs font-black leading-tight text-violet-950">
              Lumi está com você
            </p>
            <p className="mt-0.5 text-[10px] font-semibold leading-4 text-violet-500">
              Toque numa ferramenta e crie em segundos.
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <main className="planify-ui3 pl-shell-root pl-app-bg flex h-screen w-screen overflow-hidden text-slate-950">
      {/* Sidebar fixa — desktop */}
      <aside className="pl-sidebar hidden h-screen w-[min(280px,28vw)] shrink-0 flex flex-col overflow-hidden border-r lg:flex">
        {sidebarChrome}
      </aside>

      {/* Drawer mobile */}
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
              className="fixed inset-0 z-40 bg-violet-950/40 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="pl-sidebar fixed inset-y-0 left-0 z-50 flex h-screen w-[min(300px,88vw)] flex-col overflow-hidden border-r shadow-2xl lg:hidden"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-rose-100/50 px-4 py-4">
                <PlanifyBrand />
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Fechar menu"
                  className="flex h-9 w-9 items-center justify-center rounded-2xl text-violet-400 transition hover:bg-white/80"
                >
                  <PlanifyIcon name="close" className="h-5 w-5" />
                </button>
              </div>
              {sidebarScroll}
              <div className="shrink-0 border-t border-rose-100/40 px-4 py-3">
                <div className="pl-lumi-card flex items-center gap-3 rounded-2xl p-3">
                  <LumiMascot size={44} animated />
                  <p className="text-xs font-black text-violet-950">
                    Lumi está com você
                  </p>
                </div>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      {/* Área principal — flex-1, sem scroll na página */}
      <section className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        {!isDashboard ? (
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-rose-100/60 bg-white/75 px-4 py-3 backdrop-blur-md sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menu"
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-violet-600 transition hover:bg-fuchsia-50 lg:hidden"
              >
                <PlanifyIcon name="menu" className="h-5 w-5" />
              </button>
              {!compact ? (
                <div className="min-w-0 hidden sm:block">
                  <h1 className="truncate text-lg font-black tracking-tight text-violet-950">
                    {pageMeta.title}
                  </h1>
                  <p className="truncate text-xs font-semibold text-violet-400">
                    {pageMeta.subtitle}
                  </p>
                </div>
              ) : (
                <div className="min-w-0 lg:hidden">
                  <PlanifyBrand compact />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {action}
              <Link
                href="/planos"
                className="hidden rounded-2xl border border-fuchsia-100 bg-gradient-to-r from-white to-rose-50 px-3.5 py-2 text-xs font-black text-violet-700 transition hover:border-fuchsia-200 sm:inline-flex"
              >
                Planos
              </Link>
            </div>
          </header>
        ) : (
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-rose-100/50 bg-white/60 px-3 py-2 backdrop-blur-md lg:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-violet-600 transition hover:bg-fuchsia-50"
            >
              <PlanifyIcon name="menu" className="h-5 w-5" />
            </button>
            <PlanifyBrand compact />
            <Link
              href="/planos"
              className="rounded-2xl border border-fuchsia-100 bg-rose-50/80 px-3 py-1.5 text-[11px] font-black text-violet-700"
            >
              Planos
            </Link>
          </div>
        )}

        <div
          key={pathname}
          className={`pl-main-pane pl-fade-rise min-h-0 flex-1 overflow-x-hidden ${
            isDashboard ? "overflow-hidden" : "overflow-y-auto"
          }`}
        >
          {children}
        </div>
      </section>
    </main>
  );
}
