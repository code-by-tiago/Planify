"use client";

import dynamic from "next/dynamic";
import { TeachyMateriaisStudio } from "@/components/dashboard/TeachyMateriaisStudio";
import { PlanifyDashboardWelcome } from "@/components/dashboard/PlanifyDashboardWelcome";
import type { DashboardSectionId } from "@/lib/pro/dashboardViews";
import type { PlanifyToolId } from "@/lib/pro/planifyTools";

function PanelLoading() {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center bg-white">
      <p className="text-sm font-bold text-indigo-600">Carregando…</p>
    </div>
  );
}

const PlanejamentosClient = dynamic(
  () =>
    import("@/app/planejamentos/PlanejamentosClient").then(
      (m) => m.PlanejamentosClient,
    ),
  { ssr: false, loading: PanelLoading },
);

const EditorClient = dynamic(
  () => import("@/app/editor/EditorClient").then((m) => m.default),
  { ssr: false, loading: PanelLoading },
);

const HistoricoClient = dynamic(
  () =>
    import("@/app/historico/HistoricoClient").then((m) => m.HistoricoClient),
  { ssr: false, loading: PanelLoading },
);

const BibliotecaClient = dynamic(
  () => import("@/app/biblioteca/BibliotecaClient").then((m) => m.default),
  { ssr: false, loading: PanelLoading },
);

const MarketplaceClient = dynamic(
  () => import("@/app/marketplace/MarketplaceClient").then((m) => m.default),
  { ssr: false, loading: PanelLoading },
);

import type { ReactNode } from "react";

function SectionPanel({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-white">
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

type PlanifyDashboardMainProps = {
  toolId: PlanifyToolId | null;
  sectionId: DashboardSectionId | null;
  initialTopic: string;
  onTopicChange: (topic: string) => void;
  onClosePanel: () => void;
};

export function PlanifyDashboardMain({
  toolId,
  sectionId,
  initialTopic,
  onTopicChange,
  onClosePanel,
}: PlanifyDashboardMainProps) {
  if (toolId) {
    return (
      <TeachyMateriaisStudio
        toolId={toolId}
        temaFromUrl={initialTopic}
        onClose={onClosePanel}
      />
    );
  }

  if (sectionId === "planejamentos") {
    return (
      <SectionPanel>
        <PlanejamentosClient />
      </SectionPanel>
    );
  }

  if (sectionId === "editor") {
    return (
      <SectionPanel>
        <EditorClient embedded />
      </SectionPanel>
    );
  }

  if (sectionId === "historico") {
    return (
      <SectionPanel>
        <HistoricoClient />
      </SectionPanel>
    );
  }

  if (sectionId === "biblioteca") {
    return (
      <SectionPanel>
        <BibliotecaClient />
      </SectionPanel>
    );
  }

  if (sectionId === "marketplace") {
    return (
      <SectionPanel>
        <MarketplaceClient />
      </SectionPanel>
    );
  }

  return (
    <PlanifyDashboardWelcome
      topic={initialTopic}
      onTopicChange={onTopicChange}
    />
  );
}

export default PlanifyDashboardMain;
