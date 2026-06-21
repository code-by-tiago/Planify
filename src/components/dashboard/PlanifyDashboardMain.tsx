"use client";

import dynamic from "next/dynamic";
import { type ReactNode } from "react";
import { ComunidadeDashboardRouter } from "@/components/community/docente/ComunidadeDashboardRouter";
import { TeachySectionHub } from "@/components/teachy-layout";
import TeachyStudioHome from "@/components/dashboard/TeachyStudioHome";
import { TeachyMateriaisStudio } from "@/components/dashboard/TeachyMateriaisStudio";
import { PlanifyWorkspaceProvider } from "@/components/pro/planify-workspace-context";
import type { DashboardSectionId } from "@/lib/pro/dashboardViews";
import type { PlanifyToolId, ToolCategoryId } from "@/lib/pro/planifyTools";

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

const AulaCompletaClient = dynamic(
  () =>
    import("@/app/aula-completa/AulaCompletaClient").then(
      (m) => m.AulaCompletaClient,
    ),
  { ssr: false, loading: PanelLoading },
);

const CorrecaoClient = dynamic(
  () =>
    import("@/app/correcao/CorrecaoClient").then((m) => m.CorrecaoClient),
  { ssr: false, loading: PanelLoading },
);

const BancoQuestoesClient = dynamic(
  () =>
    import("@/app/banco-questoes/BancoQuestoesClient").then(
      (m) => m.BancoQuestoesClient,
    ),
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

const BnccProgressClient = dynamic(
  () =>
    import("@/components/bncc/BnccProgressClient").then(
      (m) => m.BnccProgressClient,
    ),
  { ssr: false, loading: PanelLoading },
);

const DirectorPanelClient = dynamic(
  () =>
    import("@/components/bncc/DirectorPanelClient").then(
      (m) => m.DirectorPanelClient,
    ),
  { ssr: false, loading: PanelLoading },
);

function EmbeddedSection({ children }: { children: ReactNode }) {
  return (
    <PlanifyWorkspaceProvider embeddedInDashboard>
      <div className="pf-scope flex h-full min-h-0 w-full flex-col overflow-hidden">
        {children}
      </div>
    </PlanifyWorkspaceProvider>
  );
}

function SectionPanel({ children }: { children: ReactNode }) {
  return (
    <PlanifyWorkspaceProvider embeddedInDashboard>
      <TeachySectionHub singleColumn>{children}</TeachySectionHub>
    </PlanifyWorkspaceProvider>
  );
}

type PlanifyDashboardMainProps = {
  toolId: PlanifyToolId | null;
  sectionId: DashboardSectionId | null;
  initialTopic: string;
  initialCategory?: ToolCategoryId | null;
  onTopicChange: (topic: string) => void;
  onSelectTool: (toolId: PlanifyToolId) => void;
  onSelectSection: (sectionId: DashboardSectionId) => void;
  onSelectCategory?: (category: ToolCategoryId) => void;
  onClosePanel: () => void;
};

export function PlanifyDashboardMain({
  toolId,
  sectionId,
  initialTopic,
  initialCategory = null,
  onTopicChange,
  onSelectTool,
  onSelectSection,
  onSelectCategory,
  onClosePanel,
}: PlanifyDashboardMainProps) {
  if (toolId) {
    if (toolId === "inclusao") {
      return (
        <PlanifyWorkspaceProvider embeddedInDashboard>
          <div className="pf-scope flex h-full min-h-0 w-full flex-col overflow-hidden">
            <InclusaoClient studioMode onStudioClose={onClosePanel} />
          </div>
        </PlanifyWorkspaceProvider>
      );
    }

    if (toolId === "aula-completa") {
      return (
        <PlanifyWorkspaceProvider embeddedInDashboard>
          <div className="pf-scope flex h-full min-h-0 w-full flex-col overflow-hidden">
            <AulaCompletaClient
              studioMode
              onStudioClose={onClosePanel}
              initialTema={initialTopic}
            />
          </div>
        </PlanifyWorkspaceProvider>
      );
    }

    if (toolId === "correcao-ia") {
      return (
        <PlanifyWorkspaceProvider embeddedInDashboard>
          <div className="pf-scope flex h-full min-h-0 w-full flex-col overflow-hidden">
            <CorrecaoClient studioMode onStudioClose={onClosePanel} />
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
      <EmbeddedSection>
        <PlanejamentosClient />
      </EmbeddedSection>
    );
  }

  if (sectionId === "banco-questoes") {
    return (
      <EmbeddedSection>
        <BancoQuestoesClient />
      </EmbeddedSection>
    );
  }

  if (sectionId === "editor") {
    return (
      <EmbeddedSection>
        <EditorClient embedded />
      </EmbeddedSection>
    );
  }

  if (sectionId === "historico") {
    return (
      <EmbeddedSection>
        <HistoricoClient />
      </EmbeddedSection>
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
        <ComunidadeDashboardRouter />
      </SectionPanel>
    );
  }

  if (sectionId === "bncc") {
    return (
      <SectionPanel>
        <BnccProgressClient embedded />
      </SectionPanel>
    );
  }

  if (sectionId === "diretor") {
    return (
      <SectionPanel>
        <DirectorPanelClient embedded />
      </SectionPanel>
    );
  }

  return (
    <TeachyStudioHome
      onSelectTool={onSelectTool}
      onSelectSection={onSelectSection}
      initialTopic={initialTopic}
      initialCategory={initialCategory}
      onTopicChange={onTopicChange}
      onSelectCategory={onSelectCategory}
    />
  );
}

export default PlanifyDashboardMain;
