"use client";

import { CommunityProfilePanel } from "@/components/community/CommunityProfilePanel";
import { PlanifyModal } from "@/components/ui/PlanifyModal";

type ComunidadeDocenteProfileModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ComunidadeDocenteProfileModal({
  open,
  onClose,
}: ComunidadeDocenteProfileModalProps) {
  return (
    <PlanifyModal open={open} onClose={onClose} title="Meu perfil na comunidade" maxWidth="max-w-2xl">
      <CommunityProfilePanel />
    </PlanifyModal>
  );
}
