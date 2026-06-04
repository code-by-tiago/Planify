"use client";

import { TeachyMateriaisStudio } from "@/components/dashboard/TeachyMateriaisStudio";
import { PlanifyDashboardToolbox } from "@/components/dashboard/PlanifyDashboardToolbox";
import type { RefObject } from "react";
import type { PlanifyToolId } from "@/lib/pro/planifyTools";

type PlanifyDashboardMainProps = {
  toolId: PlanifyToolId | null;
  query: string;
  onQueryChange: (value: string) => void;
  initialTopic: string;
  onTopicChange: (topic: string) => void;
  onSelectTool: (toolId: PlanifyToolId) => void;
  onCloseTool: () => void;
  searchInputRef?: RefObject<HTMLInputElement | null>;
};

export function PlanifyDashboardMain({
  toolId,
  query,
  onQueryChange,
  initialTopic,
  onTopicChange,
  onSelectTool,
  onCloseTool,
  searchInputRef,
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

  return (
    <PlanifyDashboardToolbox
      query={query}
      onQueryChange={onQueryChange}
      onSelectTool={onSelectTool}
      topic={initialTopic}
      onTopicChange={onTopicChange}
      searchInputRef={searchInputRef}
    />
  );
}

export default PlanifyDashboardMain;
