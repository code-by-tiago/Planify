"use client";

import { EDUCAR_GOOGLE_DOMAIN } from "@/lib/google/classroom-google-account";

type ClassroomGoogleConnectFormProps = {
  institutionalEmail: string;
  onInstitutionalEmailChange: (value: string) => void;
  busy: boolean;
  onConnect: () => void;
  mode?: "connect" | "switch";
  compact?: boolean;
  planifyEmail?: string | null;
  connectedGoogleEmail?: string | null;
};

export function ClassroomGoogleConnectForm({
  institutionalEmail,
  onInstitutionalEmailChange,
  busy,
  onConnect,
  mode = "connect",
  compact = false,
  planifyEmail,
  connectedGoogleEmail,
}: ClassroomGoogleConnectFormProps) {
  const showPlanifyHint =
    Boolean(planifyEmail) &&
    !String(planifyEmail).toLowerCase().endsWith(`@${EDUCAR_GOOGLE_DOMAIN}`);

  const showMismatch =
    mode === "switch" &&
    Boolean(connectedGoogleEmail) &&
    !String(connectedGoogleEmail)
      .toLowerCase()
      .endsWith(`@${EDUCAR_GOOGLE_DOMAIN}`);

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {showMismatch ? (
        <div
          className={`rounded-lg border border-amber-200 bg-amber-50 text-amber-950 ${
            compact ? "px-2.5 py-2 text-[11px] leading-5" : "px-3 py-2.5 text-sm leading-6"
          }`}
        >
          A conta Google conectada ({connectedGoogleEmail}) não é a institucional da escola.
          Informe seu e-mail <strong>@{EDUCAR_GOOGLE_DOMAIN}</strong> para publicar no Classroom.
        </div>
      ) : (
        <p
          className={
            compact
              ? "text-[11px] leading-5 text-sky-900"
              : "text-sm leading-6 text-sky-900"
          }
        >
          {showPlanifyHint
            ? `Seu login no Planify (${planifyEmail}) pode ser pessoal. Para o Classroom, use o e-mail Google da escola.`
            : `Use o e-mail Google institucional (@${EDUCAR_GOOGLE_DOMAIN}) com acesso às turmas.`}
        </p>
      )}

      <label className="block">
        <span
          className={
            compact
              ? "mb-1 block text-[11px] font-bold text-sky-900"
              : "mb-1.5 block text-xs font-bold text-sky-900"
          }
        >
          E-mail Google da escola
        </span>
        <input
          type="email"
          value={institutionalEmail}
          onChange={(event) => onInstitutionalEmailChange(event.target.value)}
          placeholder={`professor@${EDUCAR_GOOGLE_DOMAIN}`}
          autoComplete="email"
          className={
            compact
              ? "w-full rounded-lg border border-sky-200 bg-white px-2 py-2 text-xs font-semibold text-slate-900"
              : "w-full rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900"
          }
        />
      </label>

      <button
        type="button"
        disabled={busy}
        onClick={onConnect}
        className={
          compact
            ? "w-full rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-sky-700 disabled:opacity-60"
            : "w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-black text-white transition hover:bg-sky-700 disabled:opacity-60"
        }
      >
        {busy
          ? "Abrindo Google…"
          : mode === "switch"
            ? "Trocar para conta institucional"
            : "Abrir Google e escolher conta da escola"}
      </button>

        <p
          className={
            compact
              ? "text-[10px] leading-4 text-slate-500"
              : "text-xs leading-5 text-slate-500"
          }
        >
          Login no Planify e conta Google do Classroom são separados. O botão abre a tela do
          Google para autorizar o @educar.rs.gov.br com acesso às turmas.
        </p>
    </div>
  );
}
