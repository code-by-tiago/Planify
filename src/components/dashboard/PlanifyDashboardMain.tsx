"use client";

import dynamic from "next/dynamic";
import { TeachyMateriaisStudio } from "@/components/dashboard/TeachyMateriaisStudio";
import { PlanifyDashboardHome } from "@/components/dashboard/PlanifyDashboardHome";
import type { DashboardSectionId } from "@/lib/pro/dashboardViews";
import type { PlanifyToolId } from "@/lib/pro/planifyTools";

function PanelLoading() {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center">
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

type PlanifyDashboardMainProps = {
  toolId: PlanifyToolId | null;
  sectionId: DashboardSectionId | null;
  initialTopic: string;
  onTopicChange: (topic: string) => void;
  onOpenSection: (section: DashboardSectionId) => void;
  onCloseTool: () => void;
};

export function PlanifyDashboardMain({
  toolId,
  sectionId,
  initialTopic,
  onTopicChange,
  onOpenSection,
  onCloseTool,
}: PlanifyDashboardMainProps) {
  if (toolId) {
    return (
      <TeachyMateriaisStudio
        toolId={toolId}
        temaFromUrl={initialTopic}
        onClose={onCloseTool}
      />
    );
  }

  if (sectionId === "planejamentos") {
    return <PlanejamentosClient />;
  }

  if (sectionId === "editor") {
    return <EditorClient />;
  }

  if (sectionId === "historico") {
    return <HistoricoClient />;
  }

  if (sectionId === "biblioteca") {
    return <BibliotecaClient />;
  }

  if (sectionId === "marketplace") {
    return <MarketplaceClient />;
  }

  return (
    <PlanifyDashboardHome
      initialTopic={initialTopic}
      onTopicChange={onTopicChange}
      onOpenSection={onOpenSection}
    />
  );
}

export default PlanifyDashboardMain;
