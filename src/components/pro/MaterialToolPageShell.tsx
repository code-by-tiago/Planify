"use client";

import type { ReactNode } from "react";
import { TeachyToolStudioPage } from "@/components/teachy-layout";
import type { PlanifyTool } from "@/lib/pro/planifyTools";

export type MaterialToolPageShellProps = {
  tool: PlanifyTool;
  studioMode?: boolean;
  onBack?: () => void;
  backLabel?: string;
  form: ReactNode;
  preview: ReactNode;
  formScrollAttr?: boolean;
  previewScrollAttr?: boolean;
  previewReady?: boolean;
  previewLoading?: boolean;
  /** Ignorado — só ToolStudioShell */
  legacyLayout?: boolean;
  exportDock?: ReactNode;
};

/**
 * Split layout chrome for material IA tools — config left, preview right (Teachy studio).
 */
export function MaterialToolPageShell({
  tool,
  onBack,
  backLabel = "Voltar",
  form,
  preview,
  formScrollAttr = false,
  previewScrollAttr = false,
  previewReady = false,
  previewLoading = false,
  exportDock,
}: MaterialToolPageShellProps) {
  return (
    <TeachyToolStudioPage
      icon={tool.icon}
      iconAccent={tool.accent}
      eyebrow={tool.shortTitle}
      title={tool.title}
      subtitle={tool.description}
      onBack={onBack}
      backLabel={backLabel}
      form={form}
      preview={preview}
      exportDock={exportDock}
      previewReady={previewReady}
      previewLoading={previewLoading}
      formScrollAttr={formScrollAttr}
      previewScrollAttr={previewScrollAttr}
    />
  );
}
