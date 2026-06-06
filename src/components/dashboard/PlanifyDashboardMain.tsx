"use client";

import dynamic from "next/dynamic";
import TeachyStudioHome from "@/components/dashboard/TeachyStudioHome";
import { TeachyMateriaisStudio } from "@/components/dashboard/TeachyMateriaisStudio";
import type { DashboardSectionId } from "@/lib/pro/dashboardViews";
import type { PlanifyToolId } from "@/lib/pro/planifyTools";

function PanelLoading() {
  return (
    <div className="planify-hud flex h-full min-h-[200px] items-center justify-center bg-[var(--planify-canvas)]">
      <div className="flex flex-col items-center gap-3">
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-500" />
        <p className="text-sm font-semibold text-cyan-700">Carregando…</p>
      </div>
    </div>
  );
}

const InclusaoClient = dynamic(
  () =>
    import("@/app/inclusao/InclusaoClient").then((m) => m.InclusaoClient),
  { ssr: false, loading: PanelLoading },
);

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
import { PlanifyWorkspaceProvider } from "@/components/pro/planify-workspace-context";

function SectionPanel({ children }: { children: ReactNode }) {
  return (
    <PlanifyWorkspaceProvider embeddedInDashboard>
      <div className="pl-hud-board flex h-full min-h-0 w-full flex-col overflow-hidden bg-[var(--planify-canvas)]">
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </PlanifyWorkspaceProvider>
  );
}

type PlanifyDashboardMainProps = {
  toolId: PlanifyToolId | null;
  sectionId: DashboardSectionId | null;
  initialTopic: string;
  onTopicChange: (topic: string) => void;
  onSelectTool: (toolId: PlanifyToolId) => void;
  onSelectSection: (sectionId: DashboardSectionId) => void;
  onClosePanel: () => void;
};

export function PlanifyDashboardMain({
  toolId,
  sectionId,
  initialTopic,
  onTopicChange,
  onSelectTool,
  onSelectSection,
  onClosePanel,
}: PlanifyDashboardMainProps) {
  if (toolId) {
    if (toolId === "inclusao") {
      return (
        <PlanifyWorkspaceProvider embeddedInDashboard>
          <div className="planify-hud planify-materiais-studio flex h-full min-h-0 w-full flex-col overflow-hidden bg-[var(--planify-canvas)]">
            <div className="min-h-0 flex-1 overflow-hidden">
              <InclusaoClient studioMode onStudioClose={onClosePanel} />
            </div>
          </div>
        </PlanifyWorkspaceProvider>
      );
    }

    return (
      <TeachyMateriaisStudio
        toolId={toolId}
        temaFromUrl={initialTopic}
        onClose={onClosePanel}
        onSelectTool={onSelectTool}
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
    <TeachyStudioHome
      onSelectTool={onSelectTool}
      onSelectSection={onSelectSection}
      initialTopic={initialTopic}
      onTopicChange={onTopicChange}
    />
  );
}

export default PlanifyDashboardMain;
