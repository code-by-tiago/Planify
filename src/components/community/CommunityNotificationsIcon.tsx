"use client";

import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { CommunityNotification } from "@/lib/community/types";
import { parseJsonResponse } from "@/lib/http/parse-json-response";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

function formatNotificationTime(value: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function notificationLabel(type: CommunityNotification["type"]): string {
  switch (type) {
    case "comment":
      return "comentou";
    case "like":
      return "curtiu";
    case "friend_request":
      return "solicitou amizade";
    case "friend_accepted":
      return "aceitou amizade";
    case "message":
      return "enviou mensagem";
    default:
      return "interagiu";
  }
}

function notificationHref(notification: CommunityNotification): string | null {
  if (notification.materialId) {
    return `/marketplace/material/${notification.materialId}`;
  }
  if (notification.type === "friend_request" || notification.type === "friend_accepted") {
    return `/marketplace/perfil/${notification.actorUserId}`;
  }
  if (notification.type === "message") {
    return "/dashboard?secao=marketplace";
  }
  return null;
}

type CommunityNotificationsIconProps = {
  className?: string;
};

export function CommunityNotificationsIcon({ className }: CommunityNotificationsIconProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<CommunityNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/community/notifications", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await parseJsonResponse<{
        notifications?: CommunityNotification[];
        unreadCount?: number;
      }>(response);

      if (response.ok) {
        setNotifications(data?.notifications || []);
        setUnreadCount(data?.unreadCount || 0);
      }
    } catch {
      // silencioso — tabela pode não existir ainda
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 60000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    void refresh().finally(() => setLoading(false));
  }, [open, refresh]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function markAllRead() {
    try {
      const response = await fetch("/api/community/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      const data = await parseJsonResponse<{ unreadCount?: number }>(response);
      if (response.ok) {
        setUnreadCount(data?.unreadCount || 0);
        setNotifications((current) =>
          current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })),
        );
      }
    } catch {
      // silencioso
    }
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={
          className ||
          "relative inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-cyan-400/25 bg-white/90 px-3 py-2.5 text-cyan-800 shadow-sm transition hover:border-cyan-400/45 hover:bg-cyan-50 sm:w-auto"
        }
        title="Notificações"
        aria-label="Abrir notificações"
        aria-expanded={open}
      >
        <PlanifyIcon name="spark" className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[55] bg-slate-950/25 sm:hidden"
            aria-label="Fechar notificações"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-x-4 top-[max(4.75rem,calc(env(safe-area-inset-top)+3.75rem))] z-[60] max-h-[min(70vh,24rem)] w-auto overflow-hidden rounded-2xl border border-cyan-400/20 bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-none sm:w-[min(360px,calc(100vw-2rem))]">
          <header className="flex items-center justify-between border-b border-cyan-400/15 bg-gradient-to-r from-cyan-50 to-indigo-50 px-4 py-3">
            <h3 className="text-sm font-extrabold text-slate-950">Notificações</h3>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-[11px] font-bold text-cyan-700 hover:underline"
              >
                Marcar todas como lidas
              </button>
            ) : null}
          </header>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-center text-sm font-semibold text-slate-500">Carregando…</p>
            ) : notifications.length === 0 ? (
              <p className="p-6 text-center text-sm font-medium text-slate-500">
                Nenhuma notificação por enquanto.
              </p>
            ) : (
              <ul className="divide-y divide-cyan-400/10">
                {notifications.map((notification) => {
                  const href = notificationHref(notification);
                  const content = (
                    <div
                      className={`flex gap-3 px-4 py-3 transition hover:bg-cyan-50/50 ${
                        !notification.readAt ? "bg-cyan-50/30" : ""
                      }`}
                    >
                      <CommunityAuthorAvatar
                        userId={notification.actorUserId}
                        name={notification.actorName}
                        avatarUrl={notification.actorAvatarUrl}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-5 text-slate-800">
                          <span className="font-extrabold text-slate-950">
                            {notification.actorName}
                          </span>{" "}
                          {notificationLabel(notification.type)}
                        </p>
                        {notification.bodyPreview ? (
                          <p className="mt-0.5 line-clamp-2 text-xs font-medium text-slate-500">
                            {notification.bodyPreview}
                          </p>
                        ) : null}
                        <p className="mt-1 text-[10px] font-semibold text-slate-400">
                          {formatNotificationTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  );

                  return (
                    <li key={notification.id}>
                      {href ? (
                        <Link href={href} onClick={() => setOpen(false)}>
                          {content}
                        </Link>
                      ) : (
                        content
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
        </>
      ) : null}
    </div>
  );
}
