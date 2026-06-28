"use client";

import { GoogleClassroomExportButton } from "@/components/google/GoogleClassroomExportButton";

type GoogleClassroomPopoverButtonProps = {
  title: string;
  getHtml: () => string;
  onStatus?: (message: string) => void;
  returnTo?: string;
  documentType?: string | null;
};

/** One-click Classroom export — same flow as Drive/Docs (OAuth resume + auto-open). */
export function GoogleClassroomPopoverButton(props: GoogleClassroomPopoverButtonProps) {
  return <GoogleClassroomExportButton {...props} iconOnly />;
}
