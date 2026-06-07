"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminPanel,
  adminButtonPrimaryClassName,
  adminInputClassName,
  formatAdminDate,
} from "./AdminCommandCenterShell";

type PlatformSettings = {
  registrationsEnabled: boolean;
  defaultAiModel: string;
  updatedAt: string;
};

export function AdminCriticalSettings() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [allowedModels, setAllowedModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/platform-settings", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || "Configurações indisponíveis.");
      }

      const next = data.settings as PlatformSettings;
      setSettings(next);
      setSelectedModel(next.defaultAiModel);
      setAllowedModels((data.allowedModels || []) as string[]);
    } catch (err) {
      setSettings(null);
      setError(err instanceof Error ? err.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  async function patchSettings(
    patch: Partial<Pick<PlatformSettings, "registrationsEnabled" | "defaultAiModel">>,
  ) {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/platform-settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || "Não foi possível salvar.");
      }

      const next = data.settings as PlatformSettings;
      setSettings(next);
      setSelectedModel(next.defaultAiModel);
      setMessage("Configurações críticas atualizadas.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminPanel title="Configurações Críticas">
        <p className="text-sm text-slate-500">Carregando…</p>
      </AdminPanel>
    );
  }

  return (
    <AdminPanel
      title="Configurações Críticas"
      subtitle="Kill switch de cadastros · modelo IA global · owner only"
    >
      {error ? <p className="mb-3 text-sm text-rose-400">{error}</p> : null}
      {message ? <p className="mb-3 text-sm text-emerald-400">{message}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-800/80 bg-[#0d121c] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-200">Cadastros globais</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Desabilita signup em /login e fluxos de cadastro público.
              </p>
            </div>
            <button
              type="button"
              disabled={saving || !settings}
              onClick={() =>
                void patchSettings({
                  registrationsEnabled: !settings?.registrationsEnabled,
                })
              }
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                settings?.registrationsEnabled
                  ? "bg-emerald-500/30 ring-1 ring-emerald-500/50"
                  : "bg-rose-950 ring-1 ring-rose-500/40"
              }`}
              aria-pressed={settings?.registrationsEnabled}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-slate-100 shadow transition ${
                  settings?.registrationsEnabled ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Status:{" "}
            <span
              className={
                settings?.registrationsEnabled ? "text-emerald-400" : "text-rose-400"
              }
            >
              {settings?.registrationsEnabled ? "Abertos" : "Bloqueados"}
            </span>
          </p>
        </div>

        <div className="rounded-lg border border-slate-800/80 bg-[#0d121c] p-4">
          <p className="text-sm font-bold text-slate-200">Modelo IA padrão</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Sobrescreve GEMINI_MODEL_DEFAULT no runtime (cache 30s).
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <select
              value={selectedModel}
              onChange={(event) => setSelectedModel(event.target.value)}
              className={adminInputClassName()}
            >
              {(allowedModels.length ? allowedModels : [selectedModel]).map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={saving || selectedModel === settings?.defaultAiModel}
              onClick={() => void patchSettings({ defaultAiModel: selectedModel })}
              className={adminButtonPrimaryClassName(
                saving || selectedModel === settings?.defaultAiModel,
              )}
            >
              Aplicar modelo
            </button>
          </div>
        </div>
      </div>

      {settings?.updatedAt ? (
        <p className="mt-4 text-[10px] text-slate-600">
          Última alteração: {formatAdminDate(settings.updatedAt)}
        </p>
      ) : null}
    </AdminPanel>
  );
}
