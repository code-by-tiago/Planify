"use client";

import { useEffect, useState } from "react";
import { PlanifyModal } from "@/components/ui/PlanifyModal";
import { PlanifyButton } from "@/components/ui/PlanifyButton";
import { PlanifyTextarea } from "@/components/ui/PlanifyInput";

type ComunidadeDocenteCommentModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (body: string) => Promise<void>;
  loading?: boolean;
};

export function ComunidadeDocenteCommentModal({
  open,
  title,
  onClose,
  onSubmit,
  loading = false,
}: ComunidadeDocenteCommentModalProps) {
  const [body, setBody] = useState("");

  useEffect(() => {
    if (!open) setBody("");
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    await onSubmit(body.trim());
    setBody("");
    onClose();
  }

  return (
    <PlanifyModal open={open} onClose={onClose} title="Comentar" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm font-semibold text-slate-600">{title}</p>
        <PlanifyTextarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="Escreva seu comentário..."
          autoFocus
        />
        <div className="flex gap-3">
          <PlanifyButton type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </PlanifyButton>
          <PlanifyButton
            type="submit"
            className="flex-1"
            loading={loading}
            disabled={!body.trim()}
          >
            Publicar comentário
          </PlanifyButton>
        </div>
      </form>
    </PlanifyModal>
  );
}
