import type { PlanifyToolId } from "@/lib/pro/planifyTools";
import type { LessonBundleItem } from "@/lib/aula-completa/lesson-bundle-client";

export type BundleStepStatus = "pending" | "running" | "done" | "failed";

export type BundleStreamProgressEvent = {
  type: "progress";
  index: number;
  total: number;
  toolId: PlanifyToolId;
  status: "started" | "done" | "failed";
};

export type BundleStreamItemEvent = {
  type: "item";
  item: LessonBundleItem;
};

export type BundleStreamCompleteEvent = {
  type: "complete";
  items: LessonBundleItem[];
  tema: string;
  creditCost: number;
};

export type BundleStreamErrorEvent = {
  type: "error";
  message: string;
  code?: string;
};

export type BundleStreamEvent =
  | BundleStreamProgressEvent
  | BundleStreamItemEvent
  | BundleStreamCompleteEvent
  | BundleStreamErrorEvent;
