"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import { ComunidadeDocenteCreatePostModal } from "@/components/community/docente/ComunidadeDocenteCreatePostModal";
import { ComunidadeDocenteGroupChat } from "@/components/community/docente/ComunidadeDocenteGroupChat";
import { ComunidadeDocenteDetailShell } from "@/components/community/docente/ComunidadeDocenteDetailShell";
import { ComunidadeDocenteUserPicker } from "@/components/community/docente/ComunidadeDocenteUserPicker";
import type { CommunityProfileSearchResult } from "@/lib/community/types";
import type { DocenteCreatePostInput } from "@/lib/community/docente-types";
import type { CommunityGroupDetail } from "@/server/community/community-docente-service";
import {
  comunidadeRoutes,
  formatDocenteNumber,
  formatDocenteTimeAgo,
  homeWithAba,
  isComunidadeEmbedded,
} from "@/lib/community/docente-utils";

export function ComunidadeDocenteGrupoDetailClient({
  groupId,
  forceEmbedded,
}: {
  groupId: string;
  forceEmbedded?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const embedded = isComunidadeEmbedded(searchParams, forceEmbedded);
  const homeHref = homeWithAba("grupos", embedded);

  const [group, setGroup] = useState<CommunityGroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUsers, setInviteUsers] = useState<CommunityProfileSearchResult[]>([]);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [groupTab, setGroupTab] = useState<"discussoes" | "chat">("discussoes");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (searchParams.get("tab") === "chat") {
      setGroupTab("chat");
    }
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/community/docente/grupo/${groupId}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data?.error?.message || "Grupo não encontrado.");
      }
      setGroup(data.group);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load]);

  const showToast = (message: string) => {
    setStatus(message);
    window.setTimeout(() => setStatus(""), 3000);
  };

  const handleJoinLeave = async () => {
    if (!group) return;
    const action = group.joinedByMe ? "leave_group" : "join_group";
    const response = await fetch("/api/community/docente/actions", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, groupId }),
    });
    const data = await response.json();
    if (response.ok && data.ok) {
      showToast(group.joinedByMe ? "Você saiu do grupo." : "Você entrou no grupo!");
      await load();
    } else {
      showToast(data?.error?.message || "Não foi possível atualizar sua participação.");
    }
  };

  const handleInvite = async () => {
    if (inviteUsers.length === 0) return;
    const response = await fetch("/api/community/docente/actions", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "invite_group_members",
        groupId,
        memberUserIds: inviteUsers.map((u) => u.userId),
      }),
    });
    const data = await response.json();
    if (response.ok && data.ok) {
      showToast(`${data.invited} convite(s) enviado(s)!`);
      setInviteUsers([]);
      setInviteOpen(false);
      await load();
    } else {
      showToast(data?.error?.message || "Não foi possível convidar.");
    }
  };

  const handleTransferOwnership = async (newOwnerId: string) => {
    if (!group || !window.confirm("Transferir a liderança deste grupo para este(a) membro(a)?")) {
      return;
    }
    const response = await fetch("/api/community/docente/actions", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "transfer_group_ownership",
        groupId,
        newOwnerId,
      }),
    });
    const data = await response.json();
    if (response.ok && data.ok) {
      showToast("Liderança transferida com sucesso.");
      await load();
    } else {
      showToast(data?.error?.message || "Não foi possível transferir a liderança.");
    }
  };

  const handleCreatePost = async (input: DocenteCreatePostInput) => {
    const response = await fetch("/api/community/docente/actions", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_post",
        title: input.title,
        body: input.body,
        disciplina: input.disciplina,
        tags: input.tags,
        participantUserIds: input.participantUserIds || [],
        groupId,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data?.error?.message || "Não foi possível publicar.");
    }
    showToast("Discussão publicada no grupo!");
    setCreatePostOpen(false);
    await load();
  };

  if (loading) {
    return (
      <ComunidadeDocenteDetailShell
        embedded={embedded}
        activeMenu="grupos"
        breadcrumbs={[{ label: "Grupos", href: homeHref }]}
        title="Carregando…"
      >
        <div className="flex min-h-[200px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-500" />
        </div>
      </ComunidadeDocenteDetailShell>
    );
  }

  if (error || !group) {
    return (
      <ComunidadeDocenteDetailShell
        embedded={embedded}
        activeMenu="grupos"
        breadcrumbs={[{ label: "Grupos", href: homeHref }]}
        title="Grupo"
      >
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-700">{error || "Grupo não encontrado."}</p>
          <button
            type="button"
            onClick={() => router.push(homeHref)}
            className="mt-3 rounded-xl bg-[#0F172A] px-4 py-2 text-xs font-bold text-white"
          >
            Voltar à comunidade
          </button>
        </div>
      </ComunidadeDocenteDetailShell>
    );
  }

  return (
    <ComunidadeDocenteDetailShell
      embedded={embedded}
      activeMenu="grupos"
      breadcrumbs={[{ label: "Grupos", href: homeHref }]}
      title={group.name}
      subtitle={`${group.disciplina} · ${formatDocenteNumber(group.membersCount)} membros`}
      actions={
        <>
          {group.joinedByMe ? (
            <button
              type="button"
              onClick={() => setCreatePostOpen(true)}
              className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-600"
            >
              Nova discussão
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void handleJoinLeave()}
            className={[
              "rounded-xl px-4 py-2 text-xs font-bold transition",
              group.joinedByMe
                ? "border border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                : "bg-[#0F172A] text-white hover:bg-slate-800",
            ].join(" ")}
          >
            {group.joinedByMe ? "Sair do grupo" : "Entrar no grupo"}
          </button>
          {group.isOwner ? (
            <button
              type="button"
              onClick={() => setInviteOpen((v) => !v)}
              className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-bold text-cyan-700 transition hover:bg-cyan-100"
            >
              Convidar
            </button>
          ) : null}
        </>
      }
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm leading-relaxed text-slate-600">{group.description}</p>
        <p className="mt-4 text-xs font-semibold text-slate-400">
          Criado por{" "}
          <Link
            href={comunidadeRoutes.professor(group.owner.id, embedded)}
            className="text-cyan-700 hover:underline"
          >
            {group.owner.name}
          </Link>
        </p>
      </section>

      {inviteOpen && group.isOwner ? (
        <section className="rounded-3xl border border-cyan-100 bg-cyan-50/50 p-5 shadow-sm">
          <h2 className="text-sm font-extrabold text-[#0F172A]">Convidar professores</h2>
          <div className="mt-3">
            <ComunidadeDocenteUserPicker
              label="Buscar professor(a)"
              selected={inviteUsers}
              onChange={setInviteUsers}
            />
          </div>
          <button
            type="button"
            onClick={() => void handleInvite()}
            disabled={inviteUsers.length === 0}
            className="mt-4 rounded-xl bg-[#0F172A] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50"
          >
            Enviar convites
          </button>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-[#0F172A]">Membros</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {group.members.map((member) => (
            <li key={member.id} className="rounded-2xl border border-slate-100 p-3">
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={comunidadeRoutes.professor(member.id, embedded)}
                  className="flex min-w-0 flex-1 items-center gap-3 transition hover:opacity-80"
                >
                  <CommunityAuthorAvatar
                    userId={member.id}
                    name={member.name}
                    avatarUrl={member.avatarUrl}
                    size="sm"
                    linkable={false}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#0F172A]">
                      {member.name}
                      {member.id === group.owner.id ? (
                        <span className="ml-2 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                          Dono(a)
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">{member.specialty}</p>
                  </div>
                </Link>
                {group.isOwner && member.id !== group.owner.id ? (
                  <button
                    type="button"
                    onClick={() => void handleTransferOwnership(member.id)}
                    className="min-h-11 shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-800"
                  >
                    Tornar responsável
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setGroupTab("discussoes")}
            className={[
              "rounded-xl px-4 py-2 text-xs font-bold transition",
              groupTab === "discussoes"
                ? "bg-[#0F172A] text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-cyan-200",
            ].join(" ")}
          >
            Discussões
          </button>
          <button
            type="button"
            onClick={() => setGroupTab("chat")}
            className={[
              "rounded-xl px-4 py-2 text-xs font-bold transition",
              groupTab === "chat"
                ? "bg-[#0F172A] text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-cyan-200",
            ].join(" ")}
          >
            Chat do grupo
          </button>
        </div>

        {groupTab === "chat" ? (
          <div className="mt-4">
            <ComunidadeDocenteGroupChat groupId={groupId} enabled={group.joinedByMe} />
          </div>
        ) : (
          <>
            <h2 className="mt-4 text-sm font-extrabold text-[#0F172A]">Discussões do grupo</h2>
            {group.discussions.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                <p className="text-sm text-slate-500">
                  Seja o primeiro(a) a publicar no grupo.
                </p>
                {group.joinedByMe ? (
                  <button
                    type="button"
                    onClick={() => setCreatePostOpen(true)}
                    className="mt-4 rounded-xl bg-[#0F172A] px-5 py-2.5 text-xs font-bold text-white"
                  >
                    Criar discussão
                  </button>
                ) : null}
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {group.discussions.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={comunidadeRoutes.discussao(d.id, embedded)}
                      className="block rounded-2xl border border-slate-100 p-4 transition hover:border-cyan-200 hover:bg-cyan-50/20"
                    >
                      <p className="font-bold text-[#0F172A]">{d.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {d.author.name} · {formatDocenteTimeAgo(d.createdAt)} ·{" "}
                        {formatDocenteNumber(d.commentsCount)} comentários
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      {status ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold shadow-xl">
          {status}
        </div>
      ) : null}

      <ComunidadeDocenteCreatePostModal
        open={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        onSubmit={handleCreatePost}
        defaultDisciplina={group.disciplina as DocenteCreatePostInput["disciplina"]}
      />
    </ComunidadeDocenteDetailShell>
  );
}
