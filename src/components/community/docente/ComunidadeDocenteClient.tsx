"use client";

<<<<<<< HEAD
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
=======
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ComunidadeDocenteCreatePostModal, type ComposerIntent } from "@/components/community/docente/ComunidadeDocenteCreatePostModal";
import { ComunidadeDocenteBnccChallengeModal } from "@/components/community/docente/ComunidadeDocenteBnccChallengeModal";
import { ComunidadeDocenteComposer } from "@/components/community/docente/ComunidadeDocenteComposer";
import { ComunidadeDocenteDiscussions } from "@/components/community/docente/ComunidadeDocenteDiscussions";
import { ComunidadeMaterialPreviewModal } from "@/components/community/docente/ComunidadeMaterialPreviewModal";
import { ComunidadeDocenteRightSidebar } from "@/components/community/docente/ComunidadeDocenteRightSidebar";
import {
  ComunidadeDocenteDesafios,
  ComunidadeDocenteSalvos,
} from "@/components/community/docente/ComunidadeDocenteSections";
import { ComunidadeDocenteSharePrompt } from "@/components/community/docente/ComunidadeDocenteSharePrompt";
import { ComunidadeDocenteTopBar } from "@/components/community/docente/ComunidadeDocenteTopBar";
import { ComunidadeDocenteTrending } from "@/components/community/docente/ComunidadeDocenteTrending";
>>>>>>> origin/aplicar-melhorias-na-producao
import { IconX } from "@/components/community/docente/docente-icons";
import type {
  DocenteAuthor,
  DocenteBadgeProgress,
<<<<<<< HEAD
  DocenteCreateGroupInput,
  DocenteCreatePostInput,
  DocenteDiscussion,
  DocenteDisciplina,
  DocenteEvent,
  DocenteMaterial,
  DocenteMenuItem,
  DocenteRecentPublication,
=======
  DocenteCreatePostInput,
  DocenteDiscussion,
  DocenteDisciplina,
  DocenteMaterial,
  DocenteMenuItem,
>>>>>>> origin/aplicar-melhorias-na-producao
  DocenteStats,
} from "@/lib/community/docente-types";
import {
  buildOverviewQueryParams,
  buscaHref,
  comunidadeRoutes,
  homeWithAba,
  parseDocenteMenuItem,
} from "@/lib/community/docente-utils";
import { downloadMarketplaceMaterial, resolveMarketplaceDownloadParams } from "@/lib/marketplace/marketplace-download-client";
import { submitDocenteCreatePost } from "@/lib/community/docente-create-post-client";
<<<<<<< HEAD
import { usePersistedSidebarCollapsed } from "@/hooks/usePersistedSidebarCollapsed";
=======
>>>>>>> origin/aplicar-melhorias-na-producao
import {
  getHiddenFeedMaterialIds,
  hideFeedMaterialOnServer,
  migrateLocalHiddenFeedMaterialsToServer,
  setHiddenFeedMaterialIds,
  unhideFeedMaterialOnServer,
} from "@/lib/community/hidden-feed-materials";
<<<<<<< HEAD
=======
import {
  markGoogleDrivePickerResumeReady,
  readGoogleDrivePickerPending,
} from "@/lib/google/google-drive-picker";
import {
  clearGoogleOAuthReturnParams,
  peekGoogleOAuthResumeIntent,
} from "@/lib/google/google-export-resume";
import { GOOGLE_STATUS_CHANGED_EVENT } from "@/lib/google/google-status-events";
>>>>>>> origin/aplicar-melhorias-na-producao

const EMPTY_STATS: DocenteStats = {
  activeTeachers: 0,
  sharedMaterials: 0,
  openDiscussions: 0,
<<<<<<< HEAD
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
  teachers?: DocenteAuthor[];
=======
>>>>>>> origin/aplicar-melhorias-na-producao
};

export function ComunidadeDocenteClient({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeMenu, setActiveMenu] = useState<DocenteMenuItem>("inicio");
  const [selectedDisciplina, setSelectedDisciplina] = useState<DocenteDisciplina | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [heroSearch, setHeroSearch] = useState("");
<<<<<<< HEAD
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
=======
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [createPostIntent, setCreatePostIntent] = useState<ComposerIntent>("texto");
>>>>>>> origin/aplicar-melhorias-na-producao
  const [mineOnly, setMineOnly] = useState(false);
  const [friendsOnly, setFriendsOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
<<<<<<< HEAD
  const [etapaFilter, setEtapaFilter] = useState("");
  const [tipoMaterialFilter, setTipoMaterialFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
=======
  const [anoSerieFilter, setAnoSerieFilter] = useState("");
  const [tipoMaterialFilter, setTipoMaterialFilter] = useState("");
  const [previewMaterialId, setPreviewMaterialId] = useState<string | null>(null);
>>>>>>> origin/aplicar-melhorias-na-producao
  const [bnccOpen, setBnccOpen] = useState(false);
  const [hiddenMaterialIds, setHiddenMaterialIdsState] = useState<Set<string>>(() =>
    getHiddenFeedMaterialIds(),
  );
  const [hiddenRevision, setHiddenRevision] = useState(0);
<<<<<<< HEAD
  const [commentTarget, setCommentTarget] = useState<{ id: string; title: string } | null>(null);
  const [commentLoading, setCommentLoading] = useState(false);
  const [downloadingMaterialId, setDownloadingMaterialId] = useState<string | null>(null);
  const [viewerName, setViewerName] = useState("Professor(a)");
=======
  const [downloadingMaterialId, setDownloadingMaterialId] = useState<string | null>(null);
  const [viewerName, setViewerName] = useState("Professor(a)");
  const [viewerProfile, setViewerProfile] = useState<{
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    coverUrl: string | null;
    topComponentes: string[];
    schoolName: string | null;
  } | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
>>>>>>> origin/aplicar-melhorias-na-producao
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [stats, setStats] = useState<DocenteStats>(EMPTY_STATS);
  const [discussions, setDiscussions] = useState<DocenteDiscussion[]>([]);
  const [materials, setMaterials] = useState<DocenteMaterial[]>([]);
<<<<<<< HEAD
  const [recentPublications, setRecentPublications] = useState<DocenteRecentPublication[]>([]);
  const [events, setEvents] = useState<DocenteEvent[]>([]);
  const [groups, setGroups] = useState<OverviewPayload["groups"]>([]);
  const [badgeProgress, setBadgeProgress] = useState<DocenteBadgeProgress[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [featuredTeacher, setFeaturedTeacher] = useState<DocenteAuthor | null>(null);
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
=======
  const [trendingMaterials, setTrendingMaterials] = useState<DocenteMaterial[]>([]);
  const [badgeProgress, setBadgeProgress] = useState<DocenteBadgeProgress[]>([]);
  const [featuredTeacher, setFeaturedTeacher] = useState<DocenteAuthor | null>(null);
  const [savedDiscussions, setSavedDiscussions] = useState<DocenteDiscussion[]>([]);

  void stats;

  const effectiveSearch = searchQuery || heroSearch;

  const decorateAuthor = useCallback(
    (author: DocenteAuthor): DocenteAuthor =>
      followingIds.has(author.id) ? { ...author, isFollowing: true } : author,
    [followingIds],
  );

  const filteredDiscussions = useMemo(() => {
    let list = discussions;
    if (effectiveSearch.trim()) {
      const q = effectiveSearch.toLowerCase();
      list = list.filter((d) =>
        `${d.title} ${d.body || ""} ${d.author.name} ${d.disciplina} ${d.tags.join(" ")}`.toLowerCase().includes(q),
      );
    }
    return list.map((d) => ({ ...d, author: decorateAuthor(d.author) }));
  }, [discussions, effectiveSearch, decorateAuthor]);
>>>>>>> origin/aplicar-melhorias-na-producao

  const effectiveHiddenMaterialIds = useMemo(() => {
    void hiddenRevision;
    return hiddenMaterialIds;
  }, [hiddenMaterialIds, hiddenRevision]);

<<<<<<< HEAD
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
=======
  void effectiveHiddenMaterialIds;

  const suggestedTeachers = useMemo(() => {
    const seen = new Set<string>();
    const candidates: DocenteAuthor[] = [];

    const consider = (author: DocenteAuthor | null | undefined) => {
      if (!author || !author.id) return;
      if (author.id === viewerProfile?.userId) return;
      if (seen.has(author.id)) return;
      seen.add(author.id);
      candidates.push(author);
    };

    consider(featuredTeacher);
    materials.forEach((m) => consider(m.author));
    discussions.forEach((d) => consider(d.author));

    return candidates
      .map(decorateAuthor)
      .filter((author) => !author.isFollowing)
      .sort((a, b) => b.reputation + b.materialsCount - (a.reputation + a.materialsCount))
      .slice(0, 4);
  }, [featuredTeacher, materials, discussions, viewerProfile?.userId, decorateAuthor]);
>>>>>>> origin/aplicar-melhorias-na-producao

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

<<<<<<< HEAD
  const loadOverview = useCallback(async (search = "") => {
    setLoading(true);
=======
  const loadOverview = useCallback(async (search = "", options?: { silent?: boolean }) => {
    const silent = Boolean(options?.silent);
    if (!silent) {
      setLoading(true);
    }
>>>>>>> origin/aplicar-melhorias-na-producao
    setLoadError("");

    try {
      const qs = buildOverviewQueryParams({
        search,
        disciplina: selectedDisciplina,
<<<<<<< HEAD
        etapa: etapaFilter || null,
        tipoMaterial: tipoMaterialFilter || null,
        tag: tagFilter || null,
=======
        anoSerie: anoSerieFilter || null,
        tipoMaterial: tipoMaterialFilter || null,
>>>>>>> origin/aplicar-melhorias-na-producao
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
<<<<<<< HEAD
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
=======
      setDiscussions((data.discussions || []).map((d: DocenteDiscussion) => ({ ...d })));
      setSavedDiscussions(data.savedDiscussions || []);
      setMaterials(data.materials || []);
      setTrendingMaterials(data.trendingMaterials || []);
      setBadgeProgress(data.badgeProgress || []);
      setFeaturedTeacher(data.featuredTeacher || null);

      const followedFromServer = new Set<string>();
      for (const d of (data.discussions || []) as DocenteDiscussion[]) {
        if (d.author?.isFollowing && d.author.id) followedFromServer.add(d.author.id);
      }
      for (const m of (data.materials || []) as DocenteMaterial[]) {
        if (m.author?.isFollowing && m.author.id) followedFromServer.add(m.author.id);
      }
      if (data.featuredTeacher?.isFollowing && data.featuredTeacher.id) {
        followedFromServer.add(String(data.featuredTeacher.id));
      }
      setFollowingIds(followedFromServer);
>>>>>>> origin/aplicar-melhorias-na-producao
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
<<<<<<< HEAD
      setLoading(false);
    }
  }, [embedded, selectedDisciplina, etapaFilter, tipoMaterialFilter, tagFilter, mineOnly, friendsOnly, savedOnly, showHidden]);
=======
      if (!silent) {
        setLoading(false);
      }
    }
  }, [selectedDisciplina, anoSerieFilter, tipoMaterialFilter, mineOnly, friendsOnly, savedOnly, showHidden]);
>>>>>>> origin/aplicar-melhorias-na-producao

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
<<<<<<< HEAD
=======
        if (data?.ok && data.profile?.userId) {
          setViewerProfile({
            userId: String(data.profile.userId),
            displayName: String(data.profile.fullName || data.profile.email || "Professor(a)"),
            avatarUrl: data.profile.avatarUrl || null,
            coverUrl: data.profile.coverUrl || null,
            topComponentes: Array.isArray(data.profile.topComponentes)
              ? data.profile.topComponentes.map((item: unknown) => String(item))
              : [],
            schoolName: data.profile.schoolName || null,
          });
        }
>>>>>>> origin/aplicar-melhorias-na-producao
      })
      .catch(() => {});
  }, [loadOverview]);

<<<<<<< HEAD
=======
  // Reabre o composer após OAuth do Google Drive.
  useEffect(() => {
    const maybeReopenCreatePost = () => {
      const pending = readGoogleDrivePickerPending();
      if (!pending?.reopenCreatePost) return;
      const oauthIntent = peekGoogleOAuthResumeIntent();
      if (!oauthIntent?.connected) return;
      markGoogleDrivePickerResumeReady();
      setCreatePostIntent("texto");
      setCreatePostOpen(true);
      clearGoogleOAuthReturnParams();
    };

    maybeReopenCreatePost();
    window.addEventListener(GOOGLE_STATUS_CHANGED_EVENT, maybeReopenCreatePost);
    return () => {
      window.removeEventListener(GOOGLE_STATUS_CHANGED_EVENT, maybeReopenCreatePost);
    };
  }, []);

>>>>>>> origin/aplicar-melhorias-na-producao
  useEffect(() => {
    const discussaoId = searchParams.get("discussao");
    if (discussaoId) {
      router.replace(comunidadeRoutes.discussao(discussaoId, embedded));
    }
  }, [router, searchParams, embedded]);

<<<<<<< HEAD
  const refreshAfterAction = useCallback(async () => {
    await loadOverview(effectiveSearch);
=======
  // Busca no feed: debounce silencioso (sem apagar a tela).
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) return;
    const timer = window.setTimeout(() => {
      void loadOverview(q, { silent: true });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchQuery, loadOverview]);

  const refreshAfterAction = useCallback(async () => {
    await loadOverview(effectiveSearch, { silent: true });
>>>>>>> origin/aplicar-melhorias-na-producao
  }, [effectiveSearch, loadOverview]);

  const handleLikeDiscussion = useCallback(
    async (id: string) => {
<<<<<<< HEAD
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

=======
>>>>>>> origin/aplicar-melhorias-na-producao
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
<<<<<<< HEAD
    [discussions, refreshAfterAction, showToast],
=======
    [refreshAfterAction, showToast],
>>>>>>> origin/aplicar-melhorias-na-producao
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
<<<<<<< HEAD
      if (isMaterialDiscussion(id)) {
        await handleSaveMaterial(materialIdFromDiscussion(id));
        return;
      }
=======
>>>>>>> origin/aplicar-melhorias-na-producao
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
<<<<<<< HEAD
        showToast(data.saved ? "Discussão salva!" : "Removida dos salvos.");
=======
        showToast(data.saved ? "Publicação salva!" : "Removida dos salvos.");
>>>>>>> origin/aplicar-melhorias-na-producao
        void refreshAfterAction();
      } else {
        showToast(data?.error?.message || "Não foi possível salvar.");
      }
    },
<<<<<<< HEAD
    [handleSaveMaterial, refreshAfterAction, showToast],
=======
    [refreshAfterAction, showToast],
  );

  const handleOpenDiscussion = useCallback(
    (id: string) => {
      router.push(comunidadeRoutes.discussao(id, embedded));
    },
    [router, embedded],
>>>>>>> origin/aplicar-melhorias-na-producao
  );

  const submitComment = useCallback(
    async (id: string, body: string) => {
<<<<<<< HEAD
      setCommentLoading(true);
      try {
        if (isMaterialDiscussion(id)) {
          const materialId = materialIdFromDiscussion(id);
          const response = await fetch(`/api/marketplace/materiais/${materialId}/comentarios`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: body }),
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

=======
      try {
>>>>>>> origin/aplicar-melhorias-na-producao
        const response = await fetch("/api/community/docente/actions", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "comment_post", postId: id, body }),
        });
        const data = await response.json();
        if (response.ok && data.ok) {
          setDiscussions((prev) =>
<<<<<<< HEAD
            prev.map((d) =>
              d.id === id ? { ...d, commentsCount: data.commentsCount } : d,
            ),
=======
            prev.map((d) => (d.id === id ? { ...d, commentsCount: data.commentsCount } : d)),
>>>>>>> origin/aplicar-melhorias-na-producao
          );
          showToast("Comentário publicado!");
          void refreshAfterAction();
        } else {
          showToast(data?.error?.message || "Não foi possível comentar.");
        }
<<<<<<< HEAD
      } finally {
        setCommentLoading(false);
=======
      } catch {
        showToast("Não foi possível comentar.");
>>>>>>> origin/aplicar-melhorias-na-producao
      }
    },
    [refreshAfterAction, showToast],
  );

<<<<<<< HEAD
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
=======
  const handleShareDiscussion = useCallback(
    (id: string) => {
      const url = `${window.location.origin}${comunidadeRoutes.discussao(id, embedded)}`;
>>>>>>> origin/aplicar-melhorias-na-producao
      void navigator.clipboard.writeText(url).then(() => {
        showToast("Link copiado para a área de transferência!");
      });
    },
    [embedded, showToast],
  );

<<<<<<< HEAD

  const handleCommentMaterial = useCallback(
    (id: string) => {
      const material = materials.find((m) => m.id === id);
      if (!material) return;
      setCommentTarget({ id: `mat-disc-${id}`, title: material.title });
    },
    [materials],
=======
  const handleDeleteDiscussion = useCallback(
    async (id: string) => {
      const response = await fetch("/api/community/docente/actions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_post", postId: id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        showToast(data?.error?.message || "Não foi possível excluir a publicação.");
        return;
      }
      setDiscussions((prev) => prev.filter((d) => d.id !== id));
      setSavedDiscussions((prev) => prev.filter((d) => d.id !== id));
      showToast("Publicação excluída.");
    },
    [showToast],
>>>>>>> origin/aplicar-melhorias-na-producao
  );

  const handleDownloadMaterial = useCallback(
    async (id: string) => {
      const material = materials.find((m) => m.id === id);
      if (!material) return;

      setDownloadingMaterialId(id);
      try {
        const downloadParams = resolveMarketplaceDownloadParams(material);
        await downloadMarketplaceMaterial({
          id,
          format: downloadParams.format,
          fallbackFileName: downloadParams.fallbackFileName,
        });
        setMaterials((prev) =>
<<<<<<< HEAD
          prev.map((m) => (m.id === id ? { ...m, viewsCount: m.viewsCount + 1 } : m)),
=======
          prev.map((m) =>
            m.id === id
              ? {
                  ...m,
                  viewsCount: m.viewsCount + 1,
                  downloadsCount: (m.downloadsCount ?? m.viewsCount) + 1,
                }
              : m,
          ),
>>>>>>> origin/aplicar-melhorias-na-producao
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
<<<<<<< HEAD
=======
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (data.following) next.add(authorId);
        else next.delete(authorId);
        return next;
      });
>>>>>>> origin/aplicar-melhorias-na-producao
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
        await submitDocenteCreatePost({ input, viewerName });
        showToast("Publicação criada com sucesso!");
<<<<<<< HEAD
        await loadOverview(effectiveSearch);
=======
        await loadOverview(effectiveSearch, { silent: true });
>>>>>>> origin/aplicar-melhorias-na-producao
      } catch (error) {
        throw error instanceof Error ? error : new Error("create_post_failed");
      }
    },
    [effectiveSearch, loadOverview, showToast, viewerName],
  );

<<<<<<< HEAD
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

=======
>>>>>>> origin/aplicar-melhorias-na-producao
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
<<<<<<< HEAD
        await loadOverview(effectiveSearch);
=======
        await loadOverview(effectiveSearch, { silent: true });
>>>>>>> origin/aplicar-melhorias-na-producao
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
<<<<<<< HEAD
        await loadOverview(effectiveSearch);
=======
        await loadOverview(effectiveSearch, { silent: true });
>>>>>>> origin/aplicar-melhorias-na-producao
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
<<<<<<< HEAD
      await loadOverview(effectiveSearch);
=======
      await loadOverview(effectiveSearch, { silent: true });
>>>>>>> origin/aplicar-melhorias-na-producao
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
<<<<<<< HEAD
      await loadOverview(effectiveSearch);
=======
      await loadOverview(effectiveSearch, { silent: true });
>>>>>>> origin/aplicar-melhorias-na-producao
    } catch {
      setHiddenMaterialIdsState((current) => new Set([...current, id]));
      setHiddenRevision((v) => v + 1);
      showToast("Não foi possível restaurar no servidor.");
    }
  }, [effectiveSearch, loadOverview, showToast]);

<<<<<<< HEAD
  const openCreatePost = useCallback(() => setCreatePostOpen(true), []);

  const handleHeroSearch = useCallback(() => {
    setSearchQuery(heroSearch);
    void loadOverview(heroSearch);
  }, [heroSearch, loadOverview]);
=======
  const openCreatePost = useCallback((intent: ComposerIntent = "texto") => {
    setCreatePostIntent(intent);
    setCreatePostOpen(true);
  }, []);
  const openOwnProfile = useCallback(() => {
    if (!viewerProfile?.userId) return;
    router.push(comunidadeRoutes.professor(viewerProfile.userId, embedded));
  }, [router, viewerProfile?.userId, embedded]);
>>>>>>> origin/aplicar-melhorias-na-producao

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

<<<<<<< HEAD
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
=======
>>>>>>> origin/aplicar-melhorias-na-producao
    if (activeMenu === "desafios") {
      return (
        <ComunidadeDocenteDesafios
          badgeProgress={badgeProgress}
          onParticipateChallenge={handleParticipateChallenge}
        />
      );
    }
<<<<<<< HEAD
=======

>>>>>>> origin/aplicar-melhorias-na-producao
    if (activeMenu === "salvos") {
      return (
        <ComunidadeDocenteSalvos
          materials={materials}
          discussions={savedDiscussions}
          embedded={embedded}
          onLike={handleLikeMaterial}
          onSave={handleSaveMaterial}
          onSaveDiscussion={handleSaveDiscussion}
          onOpenDiscussion={handleOpenDiscussion}
<<<<<<< HEAD
          onDownload={handleDownloadMaterial}
          downloadingMaterialId={downloadingMaterialId}
          onBrowseMaterials={() => setActiveMenu("materiais")}
=======
          onOpenMaterial={setPreviewMaterialId}
          onDownload={handleDownloadMaterial}
          downloadingMaterialId={downloadingMaterialId}
          onBrowseMaterials={() => setActiveMenu("inicio")}
>>>>>>> origin/aplicar-melhorias-na-producao
        />
      );
    }

<<<<<<< HEAD
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
=======
    // início — home Teachy: composer + CTA + destaques + Para você
    const shareSuggestion =
      materials[0]?.title || trendingMaterials[0]?.title || null;

    return (
      <div className="mx-auto w-full max-w-[680px] space-y-4">
        <ComunidadeDocenteComposer
          viewerName={viewerName}
          viewerAvatarUrl={viewerProfile?.avatarUrl}
          viewerUserId={viewerProfile?.userId}
          onOpenComposer={openCreatePost}
        />
        <ComunidadeDocenteSharePrompt
          onShare={openCreatePost}
          suggestedTitle={shareSuggestion}
        />
        <ComunidadeDocenteTrending
          materials={trendingMaterials}
          onOpen={(id) => {
            const item = trendingMaterials.find((m) => m.id === id);
            if (item?.externalUrl) {
              window.open(item.externalUrl, "_blank", "noopener,noreferrer");
              return;
            }
            setPreviewMaterialId(id);
          }}
          onShowAll={() => {
            const first = trendingMaterials[0];
            if (first?.externalUrl) {
              window.open(first.externalUrl, "_blank", "noopener,noreferrer");
              return;
            }
            if (first) setPreviewMaterialId(first.id);
          }}
        />
        <ComunidadeDocenteDiscussions
          discussions={filteredDiscussions}
          onLike={handleLikeDiscussion}
          onSave={handleSaveDiscussion}
          onShare={handleShareDiscussion}
          onDelete={handleDeleteDiscussion}
          onOpen={handleOpenDiscussion}
          onFollow={handleFollowTeacher}
          onReply={submitComment}
          viewerName={viewerName}
          viewerAvatarUrl={viewerProfile?.avatarUrl}
          viewerUserId={viewerProfile?.userId}
        />
      </div>
>>>>>>> origin/aplicar-melhorias-na-producao
    );
  };

  const openMessagesPanel = searchParams.get("painel") === "mensagens";
<<<<<<< HEAD
=======
  const showRightSidebar = activeMenu === "inicio" || activeMenu === "salvos" || activeMenu === "desafios";
>>>>>>> origin/aplicar-melhorias-na-producao

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
<<<<<<< HEAD
          if (value.trim()) void loadOverview(value);
=======
>>>>>>> origin/aplicar-melhorias-na-producao
        }}
        onSearchSubmit={(value) => {
          const q = value.trim();
          if (q.length >= 2) {
            router.push(buscaHref(q, embedded));
<<<<<<< HEAD
          }
        }}
        onCreatePost={openCreatePost}
        onOpenMenu={() => setSidebarOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
=======
          } else if (!q) {
            void loadOverview("", { silent: true });
          }
        }}
        onCreatePost={openCreatePost}
        onSelectMenu={navigateToMenu}
        activeMenu={activeMenu}
>>>>>>> origin/aplicar-melhorias-na-producao
        initialOpenMessages={openMessagesPanel}
      />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
<<<<<<< HEAD
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
=======
        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <main className="min-h-0 flex-1 overflow-y-auto bg-[#f8fafc]">
            <div
              className={[
                "mx-auto w-full px-4 py-6 sm:px-6",
                activeMenu === "inicio" ? "max-w-[720px]" : "max-w-3xl lg:max-w-none lg:px-8",
              ].join(" ")}
            >
              {renderMainContent()}
            </div>

            {showRightSidebar ? (
              <div className="px-4 pb-8 xl:hidden">
                <ComunidadeDocenteRightSidebar
                  suggestedTeachers={suggestedTeachers}
                  viewerProfile={viewerProfile}
                  onFollow={handleFollowTeacher}
                  onOpenProfile={openOwnProfile}
                />
              </div>
            ) : null}
          </main>

          {showRightSidebar ? (
            <div className="hidden shrink-0 overflow-y-auto border-l border-slate-200/80 bg-[#f8fafc] p-5 xl:block">
              <ComunidadeDocenteRightSidebar
                suggestedTeachers={suggestedTeachers}
                viewerProfile={viewerProfile}
                onFollow={handleFollowTeacher}
                onOpenProfile={openOwnProfile}
              />
            </div>
          ) : null}
        </div>
      </div>

      <ComunidadeMaterialPreviewModal
        open={Boolean(previewMaterialId)}
        materialId={previewMaterialId || ""}
        onClose={() => setPreviewMaterialId(null)}
        onCloned={(downloadsCount) => {
          if (!previewMaterialId) return;
          setMaterials((prev) =>
            prev.map((item) =>
              item.id === previewMaterialId ? { ...item, downloadsCount } : item,
            ),
          );
          setTrendingMaterials((prev) =>
            prev.map((item) =>
              item.id === previewMaterialId ? { ...item, downloadsCount } : item,
            ),
          );
>>>>>>> origin/aplicar-melhorias-na-producao
        }}
      />

      <ComunidadeDocenteCreatePostModal
        open={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        onSubmit={handleCreatePost}
<<<<<<< HEAD
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
=======
        intent={createPostIntent}
        viewerName={viewerName}
>>>>>>> origin/aplicar-melhorias-na-producao
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
