"use client";

import { CommunityMessagesPanel } from "@/components/community/CommunityMessagesPanel";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { parseJsonResponse } from "@/lib/http/parse-json-response";
import { useCallback, useEffect, useState } from "react";

type CommunityMessagesIconProps = {
  className?: string;
  initialUserId?: string | null;
  initialOpen?: boolean;
  onInitialUserHandled?: () => void;
};

export function CommunityMessagesIcon({
  className,
  initialUserId,
  initialOpen = false,
  onInitialUserHandled,
}: CommunityMessagesIconProps) {
  const [open, setOpen] = useState(initialOpen);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const refreshUnread = useCallback(async () => {
    try {
      const response = await fetch("/api/community/messages/unread", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await parseJsonResponse<{ unreadCount?: number }>(response);
      if (response.ok) {
        setUnreadCount(data?.unreadCount || 0);
      }
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    void refreshUnread();
    const interval = window.setInterval(() => {
      void refreshUnread();
    }, 60000);
    return () => window.clearInterval(interval);
  }, [refreshUnread]);

  useEffect(() => {
    if (initialOpen) {
      setOpen(true);
    }
  }, [initialOpen]);

  useEffect(() => {
    if (!initialUserId) {
      return;
    }

    setPendingUserId(initialUserId);
    setOpen(true);
    onInitialUserHandled?.();
  }, [initialUserId, onInitialUserHandled]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ||
          "relative inline-flex w-full items-center justify-center rounded-xl border border-cyan-400/25 bg-white/90 p-2.5 text-cyan-800 shadow-sm transition hover:border-cyan-400/45 hover:bg-cyan-50 sm:w-auto"
        }
        title="Mensagens"
        aria-label="Abrir mensagens"
      >
        <PlanifyIcon name="message" className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      <CommunityMessagesPanel
        open={open}
        onClose={() => {
          setOpen(false);
          setPendingUserId(null);
          void refreshUnread();
        }}
        initialUserId={pendingUserId}
        onUnreadChange={setUnreadCount}
      />
    </>
  );
}
