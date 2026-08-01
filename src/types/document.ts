export type DocumentType =
  | "planning_annual"
  | "planning_quarterly"
  | "teaching_material"
  | "assessment"
  | "activity"
  | "editor_document";

export type DocumentFormat = "docx" | "pdf" | "html" | "markdown";

export type DocumentStatus = "draft" | "ready" | "archived";

export type DocumentFile = {
  id: string;
  documentId: string;
  format: DocumentFormat;
  filename: string;
  storagePath?: string;
  sizeInBytes?: number;
  createdAt: string;
};

export type Document = {
  id: string;
  userId: string;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  contentHtml?: string;
  contentText?: string;
  files: DocumentFile[];
  createdAt: string;
  updatedAt: string;
};