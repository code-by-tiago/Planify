"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminPanel,
  adminButtonPrimaryClassName,
  adminButtonDangerClassName,
  adminInputClassName,
  adminTableClassName,
  adminTableWrapClassName,
  formatAdminDate,
} from "./components/AdminCommandCenterShell";

type FeaturedItem = {
  id: string;
  title: string;
  description: string | null;
  tipoMaterial: string;
  componente: string | null;
  authorName: string | null;
  isFeatured: boolean;
  featuredAt: string | null;
  featuredSource: string;
  externalUrl: string | null;
  downloadsCount: number;
  createdAt: string | null;
  isPublished: boolean;
};

export function AdminCommunityFeaturedPanel() {
  const [materials, setMaterials] = useState<FeaturedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [onlyFeatured, setOnlyFeatured] = useState(false);

  const [importTitle, setImportTitle] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [importTipo, setImportTipo] = useState("Importado");
  const [importComponente, setImportComponente] = useState("");
  const [importAuthor, setImportAuthor] = useState("Planify");
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = onlyFeatured ? "?featured=1" : "";
      const response = await fetch(`/api/admin/community/featured${qs}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data?.error?.message || "Não foi possível carregar conteúdos.");
      }
      setMaterials(data.materials || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }, [onlyFeatured]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleFeatured(item: FeaturedItem) {
    setBusyId(item.id);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/community/featured", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: item.isFeatured ? "unfeature" : "feature",
          materialId: item.id,
          featuredSource: item.externalUrl ? "external" : "admin",
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data?.error?.message || "Não foi possível atualizar.");
      }
      setMessage(item.isFeatured ? "Removido de Conteúdos em alta." : "Adicionado a Conteúdos em alta.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar.");
    } finally {
      setBusyId("");
    }
  }

  async function importExternal(event: React.FormEvent) {
    event.preventDefault();
    setImporting(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/community/featured", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "import_external",
          title: importTitle,
          externalUrl: importUrl,
          tipoMaterial: importTipo,
          componente: importComponente || undefined,
          authorName: importAuthor || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data?.error?.message || "Não foi possível importar.");
      }
      setMessage("Conteúdo externo importado e destacado.");
      setImportTitle("");
      setImportUrl("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao importar.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <AdminPanel
        title="Conteúdos em alta"
        subtitle="Destaques da home da Comunidade: publicações do site e conteúdos importados de fora."
      >
        <form onSubmit={(e) => void importExternal(e)} className="mb-5 grid gap-3 rounded-xl border border-slate-700 bg-slate-900/40 p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              Importar conteúdo externo
            </p>
          </div>
          <input
            value={importTitle}
            onChange={(e) => setImportTitle(e.target.value)}
            placeholder="Título"
            required
            className={adminInputClassName()}
          />
          <input
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="URL externa (https://...)"
            required
            type="url"
            className={adminInputClassName()}
          />
          <input
            value={importTipo}
            onChange={(e) => setImportTipo(e.target.value)}
            placeholder="Tipo (Aula, Apresentação…)"
            className={adminInputClassName()}
          />
          <input
            value={importComponente}
            onChange={(e) => setImportComponente(e.target.value)}
            placeholder="Componente (opcional)"
            className={adminInputClassName()}
          />
          <input
            value={importAuthor}
            onChange={(e) => setImportAuthor(e.target.value)}
            placeholder="Autor exibido"
            className={adminInputClassName()}
          />
          <button
            type="submit"
            disabled={importing}
            className={adminButtonPrimaryClassName(importing)}
          >
            {importing ? "Importando…" : "Importar e destacar"}
          </button>
        </form>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOnlyFeatured(false)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
              !onlyFeatured ? "bg-cyan-600 text-white" : "border border-slate-700 text-slate-300"
            }`}
          >
            Todos os materiais
          </button>
          <button
            type="button"
            onClick={() => setOnlyFeatured(true)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
              onlyFeatured ? "bg-cyan-600 text-white" : "border border-slate-700 text-slate-300"
            }`}
          >
            Só em alta
          </button>
          <button type="button" onClick={() => void load()} className={adminButtonPrimaryClassName()}>
            Atualizar
          </button>
        </div>

        {error ? <p className="mb-3 text-sm font-semibold text-rose-400">{error}</p> : null}
        {message ? <p className="mb-3 text-sm font-semibold text-emerald-400">{message}</p> : null}

        {loading ? (
          <p className="text-sm text-slate-400">Carregando…</p>
        ) : materials.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum material encontrado.</p>
        ) : (
          <div className={adminTableWrapClassName()}>
            <table className={adminTableClassName()}>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Fonte</th>
                  <th>Destaque</th>
                  <th>Data</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((item) => (
                  <tr key={item.id}>
                    <td className="max-w-xs text-xs">
                      <p className="font-semibold text-slate-100">{item.title}</p>
                      <p className="text-slate-500">
                        {item.tipoMaterial}
                        {item.componente ? ` · ${item.componente}` : ""}
                        {item.authorName ? ` · ${item.authorName}` : ""}
                      </p>
                      {item.externalUrl ? (
                        <a
                          href={item.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block truncate text-cyan-400 hover:underline"
                        >
                          {item.externalUrl}
                        </a>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap text-xs capitalize">{item.featuredSource || "—"}</td>
                    <td className="text-xs">{item.isFeatured ? "Sim" : "Não"}</td>
                    <td className="whitespace-nowrap text-xs">
                      {item.featuredAt || item.createdAt
                        ? formatAdminDate(item.featuredAt || item.createdAt || "")
                        : "—"}
                    </td>
                    <td>
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => void toggleFeatured(item)}
                        className={
                          item.isFeatured
                            ? adminButtonDangerClassName()
                            : adminButtonPrimaryClassName(busyId === item.id)
                        }
                      >
                        {item.isFeatured ? "Remover destaque" : "Destacar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
