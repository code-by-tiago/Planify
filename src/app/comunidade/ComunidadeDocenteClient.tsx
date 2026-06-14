"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ComunidadeDocenteCommentModal } from "@/components/community/docente/ComunidadeDocenteCommentModal";
import { ComunidadeDocenteCreateEventModal } from "@/components/community/docente/ComunidadeDocenteCreateEventModal";
import { ComunidadeDocenteCreateGroupModal } from "@/components/community/docente/ComunidadeDocenteCreateGroupModal";
import { ComunidadeDocenteCreatePostModal } from "@/components/community/docente/ComunidadeDocenteCreatePostModal";
import { ComunidadeDocenteBnccChallengeModal } from "@/components/community/docente/ComunidadeDocenteBnccChallengeModal";
import { ComunidadeDocenteFeedFilters } from "@/components/community/docente/ComunidadeDocenteFeedFilters";
import { ComunidadeDocenteOnboarding } from "@/components/community/docente/ComunidadeDocenteOnboarding";
import { ComunidadeDocenteProfileModal } from "@/components/community/docente/ComunidadeDocenteProfileModal";
import { ComunidadeDocenteDiscussions } from "@/components/community/docente/ComunidadeDocenteDiscussions";
import { ComunidadeDocenteHero } from "@/components/community/docente/ComunidadeDocenteHero";
import { ComunidadeDocenteMaterials } from "@/components/community/docente/ComunidadeDocenteMaterials";
import { ComunidadeDocenteRightSidebar } from "@/components/community/docente/ComunidadeDocenteRightSidebar";
import {
  ComunidadeDocenteDesafios,
  ComunidadeDocenteEventos,
  ComunidadeDocenteGrupos,
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
  buildOverviewQueryParams,
  buscaHref,
  comunidadeRoutes,
  homeWithAba,
  parseDocenteMenuItem,
} from "@/lib/community/docente-utils";
import { downloadMarketplaceMaterial } from "@/lib/marketplace/marketplace-download-client";
import { usePersistedSidebarCollapsed } from "@/hooks/usePersistedSidebarCollapsed";
import {
  getHiddenFeedMaterialIds,
  hideFeedMaterialOnServer,
  migrateLocalHiddenFeedMaterialsToServer,
  setHiddenFeedMaterialIds,
  unhideFeedMaterialOnServer,
} from "@/lib/community/hidden-feed-materials";

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
  const [profileOpen, setProfileOpen] = useState(false);
  const [mineOnly, setMineOnly] = useState(false);
  const [friendsOnly, setFriendsOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [etapaFilter, setEtapaFilter] = useState("");
  const [tipoMaterialFilter, setTipoMaterialFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [bnccOpen, setBnccOpen] = useState(false);
  const [hiddenMaterialIds, setHiddenMaterialIdsState] = useState<Set<string>>(() =>
    getHiddenFeedMaterialIds(),
  );
  const [hiddenRevision, setHiddenRevision] = useState(0);
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
  const [savedDiscussions, setSavedDiscussions] = useState<DocenteDiscussion[]>([]);
  const [tipoFilter, setTipoFilter] = useState<"todos" | "posts" | "materiais">("todos");
  const { collapsed: communitySidebarCollapsed, toggle: toggleCommunitySidebarCollapsed } =
    usePersistedSidebarCollapsed("planify:community-sidebar-collapsed");

  const effectiveSearch = searchQuery || heroSearch;

  const filteredDiscussions = useMemo(() => {
    if (tipoFilter === "materiais") return [];
    let list = discussions;
    if (!effectiveSearch.trim()) return list;
    const q = effectiveSearch.toLowerCase();
    return list.filter((d) =>
      `${d.title} ${d.author.name} ${d.disciplina} ${d.tags.join(" ")}`.toLowerCase().includes(q),
    );
  }, [discussions, effectiveSearch, tipoFilter]);

  const effectiveHiddenMaterialIds = useMemo(() => {
    void hiddenRevision;
    return hiddenMaterialIds;
  }, [hiddenMaterialIds, hiddenRevision]);

  const filteredMaterials = useMemo(() => {
    if (tipoFilter === "posts") return [];
    let list = materials;
    if (!effectiveSearch.trim()) return list;
    const q = effectiveSearch.toLowerCase();
    return list.filter((m) =>
      `${m.title} ${m.author.name} ${m.disciplina}`.toLowerCase().includes(q),
    );
  }, [materials, effectiveSearch, tipoFilter]);

  const showOnboarding = useMemo(
    () =>
      !loading &&
      !loadError &&
      activeMenu === "inicio" &&
      discussions.length === 0 &&
      materials.length === 0 &&
      groups.length === 0 &&
      events.length === 0,
    [loading, loadError, activeMenu, discussions.length, materials.length, groups.length, events.length],
  );

  const navigateToMenu = useCallback(
    (item: DocenteMenuItem) => {
      setActiveMenu(item);
      if (item === "desafios") {
        router.push(embedded ? comunidadeRoutes.desafiosEmbedded : comunidadeRoutes.desafios);
        return;
      }
      if (item === "professores") {
        router.push(embedded ? comunidadeRoutes.buscaEmbedded : comunidadeRoutes.busca);
        return;
      }
      router.replace(homeWithAba(item, embedded));
    },
    [embedded, router],
  );

  const showToast = useCallback((message: string) => {
    setStatus(message);
    window.setTimeout(() => setStatus(""), 3200);
  }, []);

  const loadOverview = useCallback(async (search = "") => {
    setLoading(true);
    setLoadError("");

    try {
      const qs = buildOverviewQueryParams({
        search,
        disciplina: selectedDisciplina,
        etapa: etapaFilter || null,
        tipoMaterial: tipoMaterialFilter || null,
        tag: tagFilter || null,
        mineOnly,
        friendsOnly,
        savedOnly,
        hiddenOnly: showHidden,
      });
      const response = await fetch(`/api/community/docente${qs}`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data?.error?.message || "Não foi possível carregar a comunidade.");
      }

      setStats(data.stats || EMPTY_STATS);
      const nextDiscussions = (data.discussions || []).map((d: DocenteDiscussion) => ({
        ...d,
      }));
      setDiscussions(nextDiscussions);
      setSavedDiscussions(data.savedDiscussions || []);
      setMaterials(data.materials || []);
      setRecentPublications(data.recentPublications || []);
      setEvents(data.events || []);
      setGroups(data.groups || []);
      setBadgeProgress(data.badgeProgress || []);
      setIsAdmin(Boolean(data.isAdmin));
      setFeaturedTeacher(data.featuredTeacher || null);
      setTeachers(data.teachers || []);
      const serverHiddenIds = Array.isArray(data.hiddenMaterialIds)
        ? data.hiddenMaterialIds.map((id: unknown) => String(id)).filter(Boolean)
        : [];
      if (serverHiddenIds.length > 0) {
        setHiddenFeedMaterialIds(serverHiddenIds);
        setHiddenMaterialIdsState(new Set(serverHiddenIds));
      }
      setHiddenRevision((value) => value + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao carregar comunidade.";
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, [embedded, selectedDisciplina, etapaFilter, tipoMaterialFilter, tagFilter, mineOnly, friendsOnly, savedOnly, showHidden]);

  useEffect(() => {
    const aba = parseDocenteMenuItem(searchParams.get("aba"));
    if (aba) setActiveMenu(aba);
    if (aba === "professores") {
      router.replace(embedded ? comunidadeRoutes.buscaEmbedded : comunidadeRoutes.busca);
    }
  }, [searchParams, embedded, router]);

  useEffect(() => {
    void loadOverview();
    void migrateLocalHiddenFeedMaterialsToServer();
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
      router.replace(comunidadeRoutes.discussao(discussaoId, embedded));
    }
  }, [router, searchParams, embedded]);

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
      if (isMaterialDiscussion(id)) {
        await handleSaveMaterial(materialIdFromDiscussion(id));
        return;
      }
      const response = await fetch("/api/community/docente/actions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_post", postId: id }),
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        setDiscussions((prev) =>
          prev.map((d) => (d.id === id ? { ...d, savedByMe: data.saved } : d)),
        );
        showToast(data.saved ? "Discussão salva!" : "Removida dos salvos.");
        void refreshAfterAction();
      } else {
        showToast(data?.error?.message || "Não foi possível salvar.");
      }
    },
    [handleSaveMaterial, refreshAfterAction, showToast],
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
        router.push(comunidadeRoutes.material(materialIdFromDiscussion(id), embedded));
        return;
      }
      router.push(comunidadeRoutes.discussao(id, embedded));
    },
    [router, embedded],
  );

  const handleShareDiscussion = useCallback(
    (id: string) => {
      const path = isMaterialDiscussion(id)
        ? comunidadeRoutes.material(materialIdFromDiscussion(id), embedded)
        : comunidadeRoutes.discussao(id, embedded);
      const url = `${window.location.origin}${path}`;
      void navigator.clipboard.writeText(url).then(() => {
        showToast("Link copiado para a área de transferência!");
      });
    },
    [embedded, showToast],
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
      showToast(
        data.following
          ? "Você seguiu o professor! O professor receberá uma notificação."
          : "Deixou de seguir.",
      );
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
        router.push(comunidadeRoutes.grupo(data.groupId, embedded));
        await loadOverview(effectiveSearch);
      } else {
        showToast(data?.error?.message || "Não foi possível criar o grupo.");
        throw new Error(data?.error?.message || "create_group_failed");
      }
    },
    [effectiveSearch, embedded, loadOverview, router, showToast],
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
      if (challengeSlug === "desafio-bncc") {
        setBnccOpen(true);
        return;
      }
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

  const completeBnccChallenge = useCallback(
    async (reflection: string) => {
      const response = await fetch("/api/community/docente/actions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "participate_challenge",
          challengeSlug: "desafio-bncc",
          reflection,
        }),
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        showToast("Desafio BNCC concluído com sucesso!");
        await loadOverview(effectiveSearch);
      } else {
        showToast(data?.error?.message || "Não foi possível concluir o desafio.");
        throw new Error("bncc failed");
      }
    },
    [effectiveSearch, loadOverview, showToast],
  );

  const handleHideMaterial = useCallback(async (id: string) => {
    setHiddenMaterialIdsState((current) => new Set([...current, id]));
    setHiddenRevision((v) => v + 1);
    showToast("Material oculto do seu feed.");
    try {
      await hideFeedMaterialOnServer(id);
      await loadOverview(effectiveSearch);
    } catch {
      setHiddenMaterialIdsState((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      setHiddenRevision((v) => v + 1);
      showToast("Não foi possível salvar a preferência no servidor.");
    }
  }, [effectiveSearch, loadOverview, showToast]);

  const handleUnhideMaterial = useCallback(async (id: string) => {
    setHiddenMaterialIdsState((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
    setHiddenRevision((v) => v + 1);
    showToast("Material restaurado no seu feed.");
    try {
      await unhideFeedMaterialOnServer(id);
      await loadOverview(effectiveSearch);
    } catch {
      setHiddenMaterialIdsState((current) => new Set([...current, id]));
      setHiddenRevision((v) => v + 1);
      showToast("Não foi possível restaurar no servidor.");
    }
  }, [effectiveSearch, loadOverview, showToast]);

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
          onOpenEvent={(id) => router.push(comunidadeRoutes.evento(id, embedded))}
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
          onOpenGroup={(id) => router.push(comunidadeRoutes.grupo(id, embedded))}
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
          discussions={savedDiscussions}
          onLike={handleLikeMaterial}
          onSave={handleSaveMaterial}
          onSaveDiscussion={handleSaveDiscussion}
          onOpenDiscussion={handleOpenDiscussion}
          onDownload={handleDownloadMaterial}
          downloadingMaterialId={downloadingMaterialId}
          onBrowseMaterials={() => setActiveMenu("materiais")}
        />
      );
    }

    return (
      <>
        {(activeMenu === "inicio" ||
          activeMenu === "discussoes" ||
          activeMenu === "materiais") && (
          <ComunidadeDocenteFeedFilters
            mineOnly={mineOnly}
            friendsOnly={friendsOnly}
            savedOnly={savedOnly}
            showHidden={showHidden}
            selectedDisciplina={selectedDisciplina}
            etapa={etapaFilter}
            tipoMaterial={tipoMaterialFilter}
            tag={tagFilter}
            onToggleMineOnly={() => setMineOnly((v) => !v)}
            onToggleFriendsOnly={() => setFriendsOnly((v) => !v)}
            onToggleSavedOnly={() => setSavedOnly((v) => !v)}
            onToggleShowHidden={() => setShowHidden((v) => !v)}
            onSelectDisciplina={setSelectedDisciplina}
            onEtapaChange={setEtapaFilter}
            onTipoMaterialChange={setTipoMaterialFilter}
            onTagChange={setTagFilter}
          />
        )}

        {(activeMenu === "discussoes" || activeMenu === "materiais") && (
          <section className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <span className="text-xs font-bold text-slate-500">Filtrar:</span>
            {(
              [
                ["todos", "Tudo"],
                ["posts", "Discussões"],
                ["materiais", "Materiais"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTipoFilter(value)}
                className={[
                  "rounded-xl px-3 py-1.5 text-xs font-bold transition",
                  tipoFilter === value
                    ? "bg-[#0F172A] text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-cyan-200",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </section>
        )}

        {activeMenu === "inicio" ? (
          <>
            <ComunidadeDocenteHero
              heroSearch={heroSearch}
              onHeroSearchChange={setHeroSearch}
              onHeroSearch={handleHeroSearch}
            />
            <ComunidadeDocenteStats stats={stats} />
            {showOnboarding ? (
              <ComunidadeDocenteOnboarding
                onOpenProfile={() => setProfileOpen(true)}
                onCreatePost={openCreatePost}
                onCreateGroup={() => setCreateGroupOpen(true)}
                onBrowseTeachers={() => router.push(buscaHref("", embedded))}
              />
            ) : null}
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
            onHideMaterial={handleHideMaterial}
            onUnhideMaterial={handleUnhideMaterial}
            showHidden={showHidden}
            embedded={embedded}
          />
        )}
      </>
    );
  };

  const openMessagesPanel = searchParams.get("painel") === "mensagens";

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
        onOpenProfile={() => setProfileOpen(true)}
        initialOpenMessages={openMessagesPanel}
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
            navigateToMenu(item);
            setSidebarOpen(false);
          }}
          onSelectDisciplina={(disciplina) => {
            setSelectedDisciplina(disciplina);
            navigateToMenu("materiais");
            setSidebarOpen(false);
          }}
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
                  navigateToMenu("eventos");
                  return;
                }
                navigateToMenu(menu);
              }}
              onOpenEvent={(id) => router.push(comunidadeRoutes.evento(id, embedded))}
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
                  navigateToMenu("eventos");
                  return;
                }
                navigateToMenu(menu);
              }}
              onOpenEvent={(id) => router.push(comunidadeRoutes.evento(id, embedded))}
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

      <ComunidadeDocenteProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />

      <ComunidadeDocenteBnccChallengeModal
        open={bnccOpen}
        onClose={() => setBnccOpen(false)}
        onComplete={completeBnccChallenge}
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
