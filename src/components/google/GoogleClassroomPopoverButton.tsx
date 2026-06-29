"use client";

import { GoogleClassroomIcon } from "@/components/google/GoogleClassroomIcon";
import { GoogleClassroomShareModal } from "@/components/google/GoogleClassroomShareModal";
import {
  GOOGLE_ICON_ONLY_BUTTON_CLASS,
  GOOGLE_PRODUCT_ICON_CLASS,
} from "@/components/google/google-icon-button-styles";
import { CLASSROOM_OPEN_AFTER_OAUTH_KEY } from "@/hooks/useGoogleClassroomExport";
import { normalizeGoogleOAuthReturnTo } from "@/lib/google/document-type-detection";
import { peekGoogleOAuthResumeIntent } from "@/lib/google/google-export-resume";
import { GOOGLE_STATUS_CHANGED_EVENT } from "@/lib/google/google-status-events";
import { useCallback, useEffect, useMemo, useState } from "react";

const CLASSROOM_OPEN_AFTER_OAUTH_BUTTON_KEY =
  "planify:classroom-open-after-oauth-button";

function sanitizeReturnToForButtonId(returnTo?: string) {
  if (!returnTo) return "";
  try {
    const normalized = normalizeGoogleOAuthReturnTo(returnTo);
    const url = new URL(normalized, "http://example.com");
    url.searchParams.delete("google");
    url.searchParams.delete("google_error");
    return `${url.pathname}${url.search}`;
  } catch {
    return returnTo;
  }
}

function resolveClassroomPopoverButtonId(
  title: string,
  returnTo?: string,
  documentType?: string | null,
) {
  return `${CLASSROOM_OPEN_AFTER_OAUTH_BUTTON_KEY}:${title}:${sanitizeReturnToForButtonId(
    returnTo,
  )}:${documentType ?? ""}`;
}

type GoogleClassroomPopoverButtonProps = {
  title: string;
  getHtml: () => string;
  onStatus?: (message: string) => void;
  returnTo?: string;
  documentType?: string | null;
};

function hasPublishableDocument(title: string, getHtml: () => string): boolean {
  if (!title.trim()) return false;

  try {
    return String(getHtml() || "").trim().length > 0;
  } catch {
    return false;
  }
}

export function GoogleClassroomPopoverButton({
  title,
  getHtml,
  onStatus,
  returnTo,
  documentType,
}: GoogleClassroomPopoverButtonProps) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(() =>
    hasPublishableDocument(title, getHtml),
  );
  const buttonId = useMemo(
    () => resolveClassroomPopoverButtonId(title, returnTo, documentType),
    [title, returnTo, documentType],
  );

  useEffect(() => {
    const sync = () => setVisible(hasPublishableDocument(title, getHtml));
    sync();
    const timer = window.setInterval(sync, 1500);
    return () => window.clearInterval(timer);
  }, [title, getHtml]);

  const openClassroomModal = useCallback(() => {
    if (!hasPublishableDocument(title, getHtml)) return;
    setOpen(true);
  }, [getHtml, title]);

  useEffect(() => {
    const OPEN_HANDLED_KEY = "planify:classroom-open-after-oauth-handled";
    const OPEN_BUTTON_KEY = "planify:classroom-open-after-oauth-button";

    function maybeOpenAfterOAuth() {
      const hasOAuthIntent = Boolean(peekGoogleOAuthResumeIntent()?.connected);

      try {
        const alreadyHandled = window.sessionStorage.getItem(OPEN_HANDLED_KEY) === "1";
        const openFlag = window.sessionStorage.getItem(CLASSROOM_OPEN_AFTER_OAUTH_KEY);
        const targetButtonId = window.sessionStorage.getItem(OPEN_BUTTON_KEY);

        if (alreadyHandled || openFlag !== "1" || targetButtonId !== buttonId) {
          return;
        }

        if (!hasOAuthIntent && openFlag !== "1") {
          return;
        }

        window.sessionStorage.setItem(OPEN_HANDLED_KEY, "1");
        window.sessionStorage.removeItem(CLASSROOM_OPEN_AFTER_OAUTH_KEY);
        window.sessionStorage.removeItem(OPEN_BUTTON_KEY);
        openClassroomModal();
      } catch {
        /* ignore */
      }
    }

    window.addEventListener(GOOGLE_STATUS_CHANGED_EVENT, maybeOpenAfterOAuth);
    maybeOpenAfterOAuth();

    return () => {
      window.removeEventListener(GOOGLE_STATUS_CHANGED_EVENT, maybeOpenAfterOAuth);
    };
  }, [buttonId, openClassroomModal]);

  if (!visible) return null;

  return (
    <>
      <button
        type="button"
        onClick={openClassroomModal}
        className={GOOGLE_ICON_ONLY_BUTTON_CLASS}
        aria-label="Enviar ao Classroom"
        title="Enviar ao Classroom"
        aria-expanded={open}
      >
        <GoogleClassroomIcon className={GOOGLE_PRODUCT_ICON_CLASS} />
      </button>

      <GoogleClassroomShareModal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        getHtml={getHtml}
        onStatus={onStatus}
        returnTo={returnTo}
        documentType={documentType}
        oauthButtonId={buttonId}
      />
    </>
  );
}
