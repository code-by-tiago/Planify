"use client";

import {
  COMMUNITY_BIO_MAX_LENGTH,
  normalizeCommunityBio,
  splitCommunityBioLines,
} from "@/lib/community/profile-bio";

type CommunityProfileBioTopicsProps = {
  bio: string | null | undefined;
  className?: string;
  emptyMessage?: string;
};

export function CommunityProfileBioTopics({
  bio,
  className = "",
  emptyMessage,
}: CommunityProfileBioTopicsProps) {
  const lines = splitCommunityBioLines(bio);

  if (!lines.length) {
    return emptyMessage ? (
      <p className={`text-sm font-medium italic text-slate-400 ${className}`}>{emptyMessage}</p>
    ) : null;
  }

  if (lines.length === 1) {
    return (
      <p className={`text-sm font-medium leading-7 text-slate-600 ${className}`}>{lines[0]}</p>
    );
  }

  return (
    <ul className={`mt-0 space-y-1.5 ${className}`} aria-label="Biografia em tópicos">
      {lines.map((line, index) => (
        <li
          key={`${index}-${line}`}
          className="flex items-start gap-2 text-sm font-medium leading-7 text-slate-600"
        >
          <span
            aria-hidden="true"
            className="mt-[0.65rem] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500/80"
          />
          <span className="min-w-0 flex-1 break-words">{line}</span>
        </li>
      ))}
    </ul>
  );
}

type CommunityProfileBioFieldProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function CommunityProfileBioField({
  value,
  onChange,
  className = "",
}: CommunityProfileBioFieldProps) {
  const normalizedPreview = normalizeCommunityBio(value) || "";
  const lineCount = splitCommunityBioLines(normalizedPreview).length;
  const charCount = value.length;

  return (
    <div className={className}>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        maxLength={COMMUNITY_BIO_MAX_LENGTH}
        placeholder="Uma linha por tópico. Pressione Enter para nova linha — ou escreva um parágrafo contínuo."
        className="w-full resize-y rounded-xl border border-cyan-400/20 bg-slate-50/80 px-3 py-2.5 text-sm font-medium leading-6 text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
      />
      <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">
        Enter cria um novo tópico (estilo Instagram). Sem Enter, o texto fica em parágrafo único.
        {" "}
        {charCount}/{COMMUNITY_BIO_MAX_LENGTH} caracteres
        {lineCount > 1 ? ` · ${lineCount} tópicos` : ""}
      </p>
    </div>
  );
}
