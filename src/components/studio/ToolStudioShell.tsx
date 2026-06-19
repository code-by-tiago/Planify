"use client";

import type { ReactNode } from "react";
import {
  MaterialToolPageShell,
  type MaterialToolPageShellProps,
} from "@/components/pro/MaterialToolPageShell";
import { PlanifyStudioShell } from "@/components/studio/PlanifyStudioShell";

export type ToolStudioShellProps = MaterialToolPageShellProps & {
  exportDock?: ReactNode;
  /** Rollback para layout anterior sem barra de export fixa. */
  legacyLayout?: boolean;
};

/**
 * Layout studio padrão Planify — config | preview + ExportDock fixo.
 */
export function ToolStudioShell({
  exportDock,
  legacyLayout = false,
  tool,
  ...shellProps
}: ToolStudioShellProps) {
  if (legacyLayout) {
    return <MaterialToolPageShell tool={tool} {...shellProps} />;
  }

  return (
    <PlanifyStudioShell
      icon={tool.icon}
      iconAccent={tool.accent}
      title={tool.title}
      subtitle={tool.description}
      eyebrow={tool.shortTitle}
      onBack={shellProps.onBack}
      backLabel={shellProps.backLabel}
      form={shellProps.form}
      preview={shellProps.preview}
      exportDock={exportDock}
      previewReady={shellProps.previewReady}
      previewLoading={shellProps.previewLoading}
      formScrollAttr={shellProps.formScrollAttr}
      previewScrollAttr={shellProps.previewScrollAttr}
      showHeader
    />
  );
}

export default ToolStudioShell;
