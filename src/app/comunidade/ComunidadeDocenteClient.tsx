"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ComunidadeDocenteCommentModal } from "@/components/community/docente/ComunidadeDocenteCommentModal";
import { ComunidadeDocenteCreateEventModal } from "@/components/community/docente/ComunidadeDocenteCreateEventModal";
import { ComunidadeDocenteCreateGroupModal } from "@/components/community/docente/ComunidadeDocenteCreateGroupModal";
import { ComunidadeDocenteCreatePostModal } from "@/components/community/docente/ComunidadeDocenteCreatePostModal";
import { ComunidadeDocenteDiscussions } from "@/components/community/docente/ComunidadeDocenteDiscussions";
import { ComunidadeDocenteHero } from "@/components/community/docente/ComunidadeDocenteHero";
import { ComunidadeDocenteMaterials } from "@/components/community/docente/ComunidadeDocenteMaterials";
import { ComunidadeDocenteRightSidebar } from "@/components/community/docente/ComunidadeDocenteRightSidebar";
import {
  ComunidadeDocenteDesafios,
  ComunidadeDocenteEventos,
  ComunidadeDocenteGrupos,
  ComunidadeDocenteProfessores,
  ComunidadeDocenteSalvos,
} from "@/components/community/docente/ComunidadeDocenteSections";
import { ComunidadeDocenteSidebar } from "@/components/community/docente/ComunidadeDocenteSidebar";
import { ComunidadeDocenteStats } from "@/components/community/docente/ComunidadeDocenteStats";
import { ComunidadeDocenteTopBar } from "@/components/community/docente/ComunidadeDocenteTopBar";
import { IconX } from "@/components/community/docente/docente-icons";
import type {
  DocenteAuthor,
  DocenteBadgeProgress,
  DocenteCreateGroupInput,
  DocenteCreatePostInput,
  DocenteDiscussion,
  DocenteDisciplina,
  DocenteEvent,
  DocenteMaterial,
  DocenteMenuItem,
  DocenteRecentPublication,
  DocenteStats,
} from "@/lib/community/docente-types";
import {
  getSavedDiscussionIds,
  toggleSavedDiscussion,
} from "@/lib/community/docente-saved-discussions";
import { downloadMarketplaceMaterial } from "@/lib/marketplace/marketplace-download-client";
import { usePersistedSidebarCollapsed } from "@/hooks/usePersistedSidebarCollapsed";
import { comunidadeRoutes } from "@/lib/community/docente-utils";

const EMPTY_STATS: DocenteStats = {
  activeTeachers: 0,
  sharedMaterials: 0,
  openDiscussions: 0,
  studyGroups: 0,
};

function isMaterialDiscussion(id: string) {
  return id.startsWith("mat-disc-");
}

function materialIdFromDiscussion(id: string) {
  return id.replace("mat-disc-", "");
}

type OverviewPayload = {
  stats: DocenteStats;
  discussions: DocenteDiscussion[];
  materials: DocenteMaterial[];
  recentPublications: DocenteRecentPublication[];
  events: DocenteEvent[];
  groups: Array<{
    id: string;
    name: string;
    description: string;
    disciplina: string;
    members_count: number;
    joinedByMe?: boolean;
  }>;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    color: string;
    min_reputation: number;
  }>;
  badgeProgress?: DocenteBadgeProgress[];
  isAdmin?: boolean;
  featuredTeacher: DocenteAuthor | null;
  teachers: DocenteAuthor[];
};

export function ComunidadeDocenteClient({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeMenu, setActiveMenu] = useState<DocenteMenuItem>("inicio");
  const [selectedDisciplina, setSelectedDisciplina] = useState<DocenteDisciplina | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [heroSearch, setHeroSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [commentTarget, setCommentTarget] = useState<{ id: string; title: string } | null>(null);
  const [commentLoading, setCommentLoading] = useState(false);
  const [downloadingMaterialId, setDownloadingMaterialId] = useState<string | null>(null);
  const [viewerName, setViewerName] = useState("Professor(a)");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [stats, setStats] = useState<DocenteStats>(EMPTY_STATS);
  const [discussions, setDiscussions] = useState<DocenteDiscussion[]>([]);
  const [materials, setMaterials] = useState<DocenteMaterial[]>([]);
  const [recentPublications, setRecentPublications] = useState<DocenteRecentPublication[]>([]);
  const [events, setEvents] = useState<DocenteEvent[]>([]);
  const [groups, setGroups] = useState<OverviewPayload["groups"]>([]);
  const [badgeProgress, setBadgeProgress] = useState<DocenteBadgeProgress[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [featuredTeacher, setFeaturedTeacher] = useState<DocenteAuthor | null>(null);
  const [teachers, setTeachers] = useState<DocenteAuthor[]>([]);
  const { collapsed: communitySidebarCollapsed, toggle: toggleCommunitySidebarCollapsed } =
    usePersistedSidebarCollapsed("planify:community-sidebar-collapsed");

  const effectiveSearch = searchQuery || heroSearch;

  const filteredDiscussions = useMemo(() => {
    let list = discussions;
    if (selectedDisciplina) {
      list = list.filter((d) => d.disciplina === selectedDisciplina);
    }
    if (!effectiveSearch.trim()) return list;
    const q = effectiveSearch.toLowerCase();
    return list.filter((d) =>
      `${d.title} ${d.author.name} ${d.disciplina} ${d.tags.join(" ")}`.toLowerCase().includes(q),
    );
  }, [discussions, effectiveSearch, selectedDisciplina]);

  const filteredMaterials = useMemo(() => {
    let list = materials;
    if (selectedDisciplina) {
      list = list.filter((m) => m.disciplina === selectedDisciplina);
    }
    if (!effectiveSearch.trim()) return list;
    const q = effectiveSearch.toLowerCase();
    return list.filter((m) =>
      `${m.title} ${m.author.name} ${m.disciplina}`.toLowerCase().includes(q),
    );
  }, [materials, effectiveSearch, selectedDisciplina]);

  const showToast = useCallback((message: string) => {
    setStatus(message);
    window.setTimeout(() => setStatus(""), 3200);
  }, []);

  const loadOverview = useCallback(async (search = "") => {
    setLoading(true);
    setLoadError("");

    try {
      const params = search ? `?q=${encodeURIComponent(search)}` : "";
      const response = await fetch(`/api/community/docente${params}`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data?.error?.message || "Não foi possível carregar a comunidade.");
      }

      setStats(data.stats || EMPTY_STATS);
      const savedIds = getSavedDiscussionIds();
      const nextDiscussions = (data.discussions || []).map((d: DocenteDiscussion) => ({
        ...d,
        savedByMe: savedIds.has(d.id) || d.savedByMe,
      }));
      setDiscussions(nextDiscussions);
      setMaterials(data.materials || []);
      setRecentPublications(data.recentPublications || []);
      setEvents(data.events || []);
      setGroups(data.groups || []);
      setBadgeProgress(data.badgeProgress || []);
      setIsAdmin(Boolean(data.isAdmin));
      setFeaturedTeacher(data.featuredTeacher || null);
      setTeachers(data.teachers || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao carregar comunidade.";
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, [embedded]);

  useEffect(() => {
    void loadOverview();
    void fetch("/api/community/profile", { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && data.profile?.fullName) {
          setViewerName(String(data.profile.fullName));
        }
      })
      .catch(() => {});
  }, [loadOverview]);

  useEffect(() => {
    const discussaoId = searchParams.get("discussao");
    if (discussaoId) {
      router.replace(comunidadeRoutes.discussao(discussaoId));
    }
  }, [router, searchParams]);

  const refreshAfterAction = useCallback(async () => {
    await loadOverview(effectiveSearch);
  }, [effectiveSearch, loadOverview]);

  const handleLikeDiscussion = useCallback(
    async (id: string) => {
      if (isMaterialDiscussion(id)) {
        const materialId = materialIdFromDiscussion(id);
        const liked = discussions.find((d) => d.id === id)?.likedByMe;
        const response = await fetch(`/api/marketplace/materiais/${materialId}/likes`, {
          method: liked ? "DELETE" : "POST",
          credentials: "include",
        });
        const data = await response.json();
        if (response.ok) {
          setDiscussions((prev) =>
            prev.map((d) =>
              d.id === id
                ? { ...d, likedByMe: data.likedByMe, likesCount: data.likesCount }
                : d,
            ),
          );
          void refreshAfterAction();
        } else {
          showToast("Não foi possível curtir.");
        }
        return;
      }

      const response = await fetch("/api/community/docente/actions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like_post", postId: id }),
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        setDiscussions((prev) =>
          prev.map((d) =>
            d.id === id ? { ...d, likedByMe: data.liked, likesCount: data.likesCount } : d,
          ),
        );
        void refreshAfterAction();
      } else {
        showToast(data?.error?.message || "Não foi possível curtir.");
      }
    },
    [discussions, refreshAfterAction, showToast],
  );

  const handleSaveMaterial = useCallback(
    async (id: string) => {
      const item = materials.find((m) => m.id === id);
      const response = await fetch("/api/community/saved-materials", {
        method: item?.savedByMe ? "DELETE" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId: id }),
      });
      if (response.ok) {
        setMaterials((prev) =>
          prev.map((m) => (m.id === id ? { ...m, savedByMe: !m.savedByMe } : m)),
        );
        showToast(item?.savedByMe ? "Material removido dos salvos." : "Material salvo!");
        void refreshAfterAction();
      } else {
        const data = await response.json().catch(() => ({}));
        showToast(data?.error?.message || "Não foi possível salvar o material.");
      }
    },
    [materials, refreshAfterAction, showToast],
  );

  const handleSaveDiscussion = useCallback(
    async (id: string) => {
      if (!isMaterialDiscussion(id)) {
        const saved = toggleSavedDiscussion(id);
        setDiscussions((prev) =>
          prev.map((d) => (d.id === id ? { ...d, savedByMe: saved } : d)),
        );
        showToast(saved ? "Discussão salva!" : "Removido dos salvos.");
        return;
      }
      await handleSaveMaterial(materialIdFromDiscussion(id));
    },
    [handleSaveMaterial, showToast],
  );

  const submitComment = useCallback(
    async (id: string, body: string) => {
      setCommentLoading(true);
      try {
        if (isMaterialDiscussion(id)) {
          const materialId = materialIdFromDiscussion(id);
          const response = await fetch(`/api/marketplace/materiais/${materialId}/comentarios`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ body }),
          });
          if (response.ok) {
            setDiscussions((prev) =>
              prev.map((d) =>
                d.id === id ? { ...d, commentsCount: d.commentsCount + 1 } : d,
              ),
            );
            showToast("Comentário publicado!");
            void refreshAfterAction();
          } else {
            showToast("Não foi possível comentar.");
          }
          return;
        }

        const response = await fetch("/api/community/docente/actions", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "comment_post", postId: id, body }),
        });
        const data = await response.json();
        if (response.ok && data.ok) {
          setDiscussions((prev) =>
            prev.map((d) =>
              d.id === id ? { ...d, commentsCount: data.commentsCount } : d,
            ),
          );
          showToast("Comentário publicado!");
          void refreshAfterAction();
        } else {
          showToast(data?.error?.message || "Não foi possível comentar.");
        }
      } finally {
        setCommentLoading(false);
      }
    },
    [refreshAfterAction, showToast],
  );

  const handleCommentDiscussion = useCallback((id: string) => {
    const discussion = discussions.find((d) => d.id === id);
    if (!discussion) return;
    setCommentTarget({ id, title: discussion.title });
  }, [discussions]);

  const handleOpenDiscussion = useCallback(
    (id: string) => {
      if (isMaterialDiscussion(id)) {
        router.push(comunidadeRoutes.material(materialIdFromDiscussion(id)));
        return;
      }
      router.push(comunidadeRoutes.discussao(id));
    },
    [router],
  );

  const handleShareDiscussion = useCallback(
    (id: string) => {
      const url = `${window.location.origin}${comunidadeRoutes.discussao(id)}`;
      void navigator.clipboard.writeText(url).then(() => {
        showToast("Link copiado para a área de transferência!");
      });
    },
    [showToast],
  );


  const handleCommentMaterial = useCallback(
    (id: string) => {
      const material = materials.find((m) => m.id === id);
      if (!material) return;
      setCommentTarget({ id: `mat-disc-${id}`, title: material.title });
    },
    [materials],
  );

  const handleDownloadMaterial = useCallback(
    async (id: string) => {
      const material = materials.find((m) => m.id === id);
      if (!material) return;

      setDownloadingMaterialId(id);
      try {
        await downloadMarketplaceMaterial({
          id,
          format: "docx",
          fallbackFileName: `${material.title}.docx`,
        });
        setMaterials((prev) =>
          prev.map((m) => (m.id === id ? { ...m, viewsCount: m.viewsCount + 1 } : m)),
        );
        showToast("Download iniciado!");
        void refreshAfterAction();
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : "Não foi possível baixar o material.",
        );
      } finally {
        setDownloadingMaterialId(null);
      }
    },
    [materials, refreshAfterAction, showToast],
  );

  const handleLikeMaterial = useCallback(async (id: string) => {
    const item = materials.find((m) => m.id === id);
    const response = await fetch(`/api/marketplace/materiais/${id}/likes`, {
      method: item?.likedByMe ? "DELETE" : "POST",
      credentials: "include",
    });
    const data = await response.json();
    if (response.ok) {
      setMaterials((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, likedByMe: data.likedByMe, likesCount: data.likesCount } : m,
        ),
      );
      void refreshAfterAction();
    } else {
      showToast("Não foi possível curtir o material.");
    }
  }, [materials, refreshAfterAction, showToast]);

  const handleFollowTeacher = useCallback(
    async (authorId: string) => {
      const response = await fetch("/api/community/docente/actions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "follow", followingId: authorId }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        showToast(data?.error?.message || "Não foi possível seguir.");
        return;
      }

      const updateAuthor = (author: DocenteAuthor): DocenteAuthor =>
        author.id === authorId
          ? {
              ...author,
              isFollowing: data.following,
              followersCount: data.following
                ? author.followersCount + 1
                : Math.max(0, author.followersCount - 1),
            }
          : author;

      setFeaturedTeacher((prev) => (prev ? updateAuthor(prev) : prev));
      setTeachers((prev) => prev.map(updateAuthor));
      showToast(data.following ? "Você seguiu o professor!" : "Deixou de seguir.");
    },
    [showToast],
  );

  const handleCreatePost = useCallback(
    async (input: DocenteCreatePostInput) => {
      try {
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
          }),
        });
        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data?.error?.message || "Não foi possível publicar.");
        }

        if (input.files.length > 0) {
          for (const file of input.files) {
            const form = new FormData();
            form.set("title", input.title);
            form.set("description", input.body || input.title);
            form.set("etapa", "Ensino Fundamental");
            form.set("anoSerie", "Geral");
            form.set("componente", input.disciplina);
            form.set("tipoMaterial", "Material de apoio");
            form.set("tema", input.title);
            form.set("tags", input.tags.join(", "));
            form.set("authorName", viewerName);
            form.set("isPublished", "true");
            form.set("file", file);
            const uploadResponse = await fetch("/api/marketplace/materiais", {
              method: "POST",
              body: form,
              credentials: "include",
            });
            if (!uploadResponse.ok) {
              const uploadData = await uploadResponse.json().catch(() => ({}));
              throw new Error(
                uploadData?.error?.message || "Não foi possível anexar o material.",
              );
            }
          }
        }

        showToast("Publicação criada com sucesso!");
        await loadOverview(effectiveSearch);
      } catch (error) {
        throw error instanceof Error ? error : new Error("create_post_failed");
      }
    },
    [effectiveSearch, loadOverview, showToast, viewerName],
  );

  const handleCreateGroup = useCallback(
    async (input: DocenteCreateGroupInput) => {
      const response = await fetch("/api/community/docente/actions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_group",
          name: input.name,
          description: input.description,
          disciplina: input.disciplina,
          memberUserIds: input.memberUserIds || [],
        }),
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        showToast("Grupo criado com sucesso!");
        router.push(comunidadeRoutes.grupo(data.groupId));
        await loadOverview(effectiveSearch);
      } else {
        showToast(data?.error?.message || "Não foi possível criar o grupo.");
        throw new Error(data?.error?.message || "create_group_failed");
      }
    },
    [effectiveSearch, loadOverview, showToast],
  );

  const handleCreateEvent = useCallback(
    async (input: {
      title: string;
      description: string;
      presenterName: string;
      startsAt: string;
      isOnline: boolean;
      location: string;
    }) => {
      const response = await fetch("/api/community/docente/actions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_event",
          ...input,
        }),
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        showToast("Evento criado com sucesso!");
        await loadOverview(effectiveSearch);
      } else {
        showToast(data?.error?.message || "Não foi possível criar o evento.");
        throw new Error(data?.error?.message || "create_event_failed");
      }
    },
    [effectiveSearch, loadOverview, showToast],
  );

  const handleJoinGroup = useCallback(
    async (groupId: string) => {
      const response = await fetch("/api/community/docente/actions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join_group", groupId }),
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        setGroups((prev) =>
          prev.map((group) =>
            group.id === groupId
              ? { ...group, joinedByMe: true, members_count: data.membersCount }
              : group,
          ),
        );
        showToast("Você entrou no grupo!");
      } else {
        showToast(data?.error?.message || "Não foi possível entrar no grupo.");
      }
    },
    [showToast],
  );

  const handleLeaveGroup = useCallback(
    async (groupId: string) => {
      const response = await fetch("/api/community/docente/actions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave_group", groupId }),
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        setGroups((prev) =>
          prev.map((group) =>
            group.id === groupId
              ? { ...group, joinedByMe: false, members_count: data.membersCount }
              : group,
          ),
        );
        showToast("Você saiu do grupo.");
      } else {
        showToast(data?.error?.message || "Não foi possível sair do grupo.");
      }
    },
    [showToast],
  );

  const handleParticipateChallenge = useCallback(
    async (challengeSlug: string) => {
      const response = await fetch("/api/community/docente/actions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "participate_challenge", challengeSlug }),
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        showToast(
          data.newlyAwarded?.length
            ? `Desafio concluído! Novo selo: ${data.newlyAwarded.join(", ")}`
            : "Desafio registrado! Continue participando para desbloquear selos.",
        );
        await loadOverview(effectiveSearch);
      } else {
        showToast(data?.error?.message || "Não foi possível registrar o desafio.");
      }
    },
    [effectiveSearch, loadOverview, showToast],
  );

  const openCreatePost = useCallback(() => setCreatePostOpen(true), []);

  const handleHeroSearch = useCallback(() => {
    setSearchQuery(heroSearch);
    void loadOverview(heroSearch);
  }, [heroSearch, loadOverview]);

  const renderMainContent = () => {
    if (loading) {
      return (
        <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-500" />
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-700">{loadError}</p>
          <button
            type="button"
            onClick={() => void loadOverview(effectiveSearch)}
            className="mt-3 rounded-xl bg-[#0F172A] px-4 py-2 text-xs font-bold text-white"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    if (activeMenu === "eventos") {
      return (
        <ComunidadeDocenteEventos
          events={events}
          isAdmin={isAdmin}
          onCreateEvent={() => setCreateEventOpen(true)}
          onOpenEvent={(id) => router.push(comunidadeRoutes.evento(id))}
        />
      );
    }
    if (activeMenu === "grupos") {
      return (
        <ComunidadeDocenteGrupos
          groups={groups}
          onCreateGroup={() => setCreateGroupOpen(true)}
          onJoinGroup={handleJoinGroup}
          onLeaveGroup={handleLeaveGroup}
          onOpenGroup={(id) => router.push(comunidadeRoutes.grupo(id))}
        />
      );
    }
    if (activeMenu === "professores") {
      return (
        <ComunidadeDocenteProfessores
          teachers={teachers}
          onFollow={handleFollowTeacher}
          onBrowseAll={() => router.push(comunidadeRoutes.busca)}
        />
      );
    }
    if (activeMenu === "desafios") {
      return (
        <ComunidadeDocenteDesafios
          badgeProgress={badgeProgress}
          onParticipateChallenge={handleParticipateChallenge}
        />
      );
    }
    if (activeMenu === "salvos") {
      return (
        <ComunidadeDocenteSalvos
          materials={materials}
          onLike={handleLikeMaterial}
          onSave={handleSaveMaterial}
          onDownload={handleDownloadMaterial}
          downloadingMaterialId={downloadingMaterialId}
          onBrowseMaterials={() => setActiveMenu("materiais")}
        />
      );
    }

    return (
      <>
        {activeMenu === "inicio" ? (
          <>
            <ComunidadeDocenteHero
              heroSearch={heroSearch}
              onHeroSearchChange={setHeroSearch}
              onHeroSearch={handleHeroSearch}
            />
            <ComunidadeDocenteStats stats={stats} />
          </>
        ) : null}

        {(activeMenu === "inicio" || activeMenu === "discussoes") && (
          <ComunidadeDocenteDiscussions
            discussions={filteredDiscussions}
            onLike={handleLikeDiscussion}
            onSave={handleSaveDiscussion}
            onComment={handleCommentDiscussion}
            onShare={handleShareDiscussion}
            onOpen={handleOpenDiscussion}
            onShowMore={() => setActiveMenu("discussoes")}
            onCreatePost={openCreatePost}
          />
        )}

        {(activeMenu === "inicio" || activeMenu === "materiais") && (
          <ComunidadeDocenteMaterials
            materials={filteredMaterials}
            onLike={handleLikeMaterial}
            onSave={handleSaveMaterial}
            onComment={handleCommentMaterial}
            onDownload={handleDownloadMaterial}
            downloadingMaterialId={downloadingMaterialId}
            onShowAll={() => setActiveMenu("materiais")}
            onCreateMaterial={openCreatePost}
          />
        )}
      </>
    );
  };

  return (
    <div
      className={[
        "flex min-h-0 flex-col bg-[#f8fafc]",
        embedded ? "h-full" : "h-[100dvh]",
      ].join(" ")}
    >
      <ComunidadeDocenteTopBar
        searchQuery={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          if (value.trim()) void loadOverview(value);
        }}
        onCreatePost={openCreatePost}
        onOpenMenu={() => setSidebarOpen(true)}
      />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {sidebarOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
          />
        ) : null}

        <ComunidadeDocenteSidebar
          activeItem={activeMenu}
          selectedDisciplina={selectedDisciplina}
          onSelectItem={(item) => {
            if (item === "desafios") {
              router.push(comunidadeRoutes.desafios);
              setSidebarOpen(false);
              return;
            }
            setActiveMenu(item);
            setSidebarOpen(false);
          }}
          onSelectDisciplina={setSelectedDisciplina}
          onClose={() => setSidebarOpen(false)}
          collapsed={communitySidebarCollapsed}
          onToggleCollapsed={toggleCommunitySidebarCollapsed}
          className={[
            "fixed inset-y-0 left-0 z-50 h-full transition-transform duration-300 lg:static lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          ].join(" ")}
        />

        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <main className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:max-w-none lg:px-8">
              {renderMainContent()}
            </div>

            <div className="px-4 pb-8 xl:hidden">
              <ComunidadeDocenteRightSidebar
                featuredTeacher={featuredTeacher}
                recentPublications={recentPublications}
                events={events}
                onFollow={handleFollowTeacher}
                onSelectMenu={(menu) => {
                if (menu === "eventos") {
                  setActiveMenu("eventos");
                  return;
                }
                setActiveMenu(menu);
              }}
              onOpenEvent={(id) => router.push(comunidadeRoutes.evento(id))}
                onCreatePost={openCreatePost}
              />
            </div>
          </main>

          <div className="hidden shrink-0 overflow-y-auto border-l border-slate-200/80 bg-[#f8fafc] p-5 xl:block">
            <ComunidadeDocenteRightSidebar
              featuredTeacher={featuredTeacher}
              recentPublications={recentPublications}
              events={events}
              onFollow={handleFollowTeacher}
              onSelectMenu={(menu) => {
                if (menu === "eventos") {
                  setActiveMenu("eventos");
                  return;
                }
                setActiveMenu(menu);
              }}
              onOpenEvent={(id) => router.push(comunidadeRoutes.evento(id))}
              onCreatePost={openCreatePost}
            />
          </div>
        </div>
      </div>

      <ComunidadeDocenteCommentModal
        open={Boolean(commentTarget)}
        title={commentTarget?.title || ""}
        onClose={() => setCommentTarget(null)}
        loading={commentLoading}
        onSubmit={async (body) => {
          if (!commentTarget) return;
          await submitComment(commentTarget.id, body);
        }}
      />

      <ComunidadeDocenteCreatePostModal
        open={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        onSubmit={handleCreatePost}
      />

      <ComunidadeDocenteCreateGroupModal
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        onSubmit={handleCreateGroup}
      />

      <ComunidadeDocenteCreateEventModal
        open={createEventOpen}
        onClose={() => setCreateEventOpen(false)}
        onSubmit={handleCreateEvent}
      />

      {status ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 flex max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl"
        >
          <p className="text-sm font-semibold text-[#0F172A]">{status}</p>
          <button
            type="button"
            onClick={() => setStatus("")}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Fechar"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default ComunidadeDocenteClient;
