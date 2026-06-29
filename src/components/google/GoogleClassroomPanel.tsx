"use client";

import { GoogleClassroomIcon } from "@/components/google/GoogleClassroomIcon";
import { GoogleClassroomShareModal } from "@/components/google/GoogleClassroomShareModal";
import {
  GOOGLE_ICON_ONLY_BUTTON_CLASS,
  GOOGLE_PRODUCT_ICON_CLASS,
} from "@/components/google/google-icon-button-styles";
import { useEffect, useState } from "react";

type GoogleClassroomPanelProps = {
  title: string;
  getHtml: () => string;
  onStatus?: (message: string) => void;
  compact?: boolean;
  returnTo?: string;
  documentType?: string | null;
};

function hasPublishableDocument(title: string, getHtml: () => string): boolean {
  if (!title.trim()) return false;

  try {
    return String(getHtml() || "").trim().length > 0;
  } catch {
    return false;
  }
}

export function GoogleClassroomPanel({
  title,
  getHtml,
  onStatus,
  compact = false,
  returnTo,
  documentType,
}: GoogleClassroomPanelProps) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(() =>
    hasPublishableDocument(title, getHtml),
  );

  useEffect(() => {
    const sync = () => setVisible(hasPublishableDocument(title, getHtml));
    sync();
    const timer = window.setInterval(sync, 1500);
    return () => window.clearInterval(timer);
  }, [title, getHtml]);

  if (!visible) return null;

  const modal = (
    <GoogleClassroomShareModal
      open={open}
      onClose={() => setOpen(false)}
      title={title}
      getHtml={getHtml}
      onStatus={onStatus}
      returnTo={returnTo}
      documentType={documentType}
    />
  );

  if (compact) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={GOOGLE_ICON_ONLY_BUTTON_CLASS}
          aria-label="Enviar ao Classroom"
          title="Enviar ao Classroom"
          aria-expanded={open}
        >
          <GoogleClassroomIcon className={GOOGLE_PRODUCT_ICON_CLASS} />
        </button>
        {modal}
      </>
    );
  }

  return (
    <div className="rounded-lg border border-sky-200 bg-sky-50/80 p-4">
      <div className="flex items-center gap-2">
        <GoogleClassroomIcon className="h-6 w-6 shrink-0" />
        <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">
          Google Classroom
        </p>
      </div>
      <p className="mt-2 text-sm leading-6 text-sky-900">
        Envie o material para uma ou varias turmas, revise o titulo e publique
        somente depois da sua confirmacao.
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-sky-700"
      >
        <GoogleClassroomIcon className="h-5 w-5 shrink-0" />
        Enviar ao Classroom
      </button>
      {modal}
    </div>
  );
}
