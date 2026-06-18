"use client";

import type { ReactNode } from "react";
import {
  MaterialToolPageShell,
  type MaterialToolPageShellProps,
} from "@/components/pro/MaterialToolPageShell";

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
  ...shellProps
}: ToolStudioShellProps) {
  if (legacyLayout) {
    return <MaterialToolPageShell {...shellProps} />;
  }

  return (
    <div className="planify-tool-studio flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-hidden">
        <MaterialToolPageShell {...shellProps} studioMode />
      </div>
      {exportDock}
    </div>
  );
}

export default ToolStudioShell;
