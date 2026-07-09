"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ComunidadeDocenteCreatePostModal, type ComposerIntent } from "@/components/community/docente/ComunidadeDocenteCreatePostModal";
import { ComunidadeDocenteBnccChallengeModal } from "@/components/community/docente/ComunidadeDocenteBnccChallengeModal";
import { ComunidadeDocenteComposer } from "@/components/community/docente/ComunidadeDocenteComposer";
import { ComunidadeDocenteDiscussions } from "@/components/community/docente/ComunidadeDocenteDiscussions";
import { ComunidadeDocenteFeedFilters } from "@/components/community/docente/ComunidadeDocenteFeedFilters";
import { ComunidadeDocenteMaterials } from "@/components/community/docente/ComunidadeDocenteMaterials";
import { ComunidadeMaterialPreviewModal } from "@/components/community/docente/ComunidadeMaterialPreviewModal";
import { ComunidadeDocenteRightSidebar } from "@/components/community/docente/ComunidadeDocenteRightSidebar";
import {
  ComunidadeDocenteDesafios,
  ComunidadeDocenteSalvos,
} from "@/components/community/docente/ComunidadeDocenteSections";
import { ComunidadeDocenteSharePrompt } from "@/components/community/docente/ComunidadeDocenteSharePrompt";
import { ComunidadeDocenteTopBar } from "@/components/community/docente/ComunidadeDocenteTopBar";
import { ComunidadeDocenteTrending } from "@/components/community/docente/ComunidadeDocenteTrending";
import { IconX } from "@/components/community/docente/docente-icons";
import type {
  DocenteAuthor,
  DocenteBadgeProgress,
  DocenteCreatePostInput,
  DocenteDiscussion,
  DocenteDisciplina,
  DocenteMaterial,
  DocenteMenuItem,
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
import {
  getHiddenFeedMaterialIds,
  hideFeedMaterialOnServer,
  migrateLocalHiddenFeedMaterialsToServer,
  setHiddenFeedMaterialIds,
  unhideFeedMaterialOnServer,
} from "@/lib/community/hidden-feed-materials";
import {
  markGoogleDrivePickerResumeReady,
  readGoogleDrivePickerPending,
} from "@/lib/google/google-drive-picker";
import {
  clearGoogleOAuthReturnParams,
  peekGoogleOAuthResumeIntent,
} from "@/lib/google/google-export-resume";
import { GOOGLE_STATUS_CHANGED_EVENT } from "@/lib/google/google-status-events";

const EMPTY_STATS: DocenteStats = {
  activeTeachers: 0,
  sharedMaterials: 0,
  openDiscussions: 0,
};

export function ComunidadeDocenteClient({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeMenu, setActiveMenu] = useState<DocenteMenuItem>("inicio");
  const [selectedDisciplina, setSelectedDisciplina] = useState<DocenteDisciplina | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [heroSearch, setHeroSearch] = useState("");
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [createPostIntent, setCreatePostIntent] = useState<ComposerIntent>("texto");
  const [mineOnly, setMineOnly] = useState(false);
  const [friendsOnly, setFriendsOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [anoSerieFilter, setAnoSerieFilter] = useState("");
  const [tipoMaterialFilter, setTipoMaterialFilter] = useState("");
  const [previewMaterialId, setPreviewMaterialId] = useState<string | null>(null);
  const [bnccOpen, setBnccOpen] = useState(false);
  const [hiddenMaterialIds, setHiddenMaterialIdsState] = useState<Set<string>>(() =>
    getHiddenFeedMaterialIds(),
  );
  const [hiddenRevision, setHiddenRevision] = useState(0);
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
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [stats, setStats] = useState<DocenteStats>(EMPTY_STATS);
  const [discussions, setDiscussions] = useState<DocenteDiscussion[]>([]);
  const [materials, setMaterials] = useState<DocenteMaterial[]>([]);
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

  const filteredMaterials = useMemo(() => {
    let list = materials;
    if (effectiveSearch.trim()) {
      const q = effectiveSearch.toLowerCase();
      list = list.filter((m) =>
        `${m.title} ${m.author.name} ${m.disciplina || ""} ${m.tipoMaterial || ""} ${m.tags?.join(" ") || ""}`
          .toLowerCase()
          .includes(q),
      );
    }
    return list.map((m) => ({ ...m, author: decorateAuthor(m.author) }));
  }, [materials, effectiveSearch, decorateAuthor]);

  const effectiveHiddenMaterialIds = useMemo(() => {
    void hiddenRevision;
    return hiddenMaterialIds;
  }, [hiddenMaterialIds, hiddenRevision]);

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

  const loadOverview = useCallback(async (search = "", options?: { silent?: boolean }) => {
    const silent = Boolean(options?.silent);
    if (!silent) {
      setLoading(true);
    }
    setLoadError("");

    try {
      const qs = buildOverviewQueryParams({
        search,
        disciplina: selectedDisciplina,
        anoSerie: anoSerieFilter || null,
        tipoMaterial: tipoMaterialFilter || null,
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
      if (!silent) {
        setLoading(false);
      }
    }
  }, [selectedDisciplina, anoSerieFilter, tipoMaterialFilter, mineOnly, friendsOnly, savedOnly, showHidden]);

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
      })
      .catch(() => {});
  }, [loadOverview]);

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

  useEffect(() => {
    const discussaoId = searchParams.get("discussao");
    if (discussaoId) {
      router.replace(comunidadeRoutes.discussao(discussaoId, embedded));
    }
  }, [router, searchParams, embedded]);

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
  }, [effectiveSearch, loadOverview]);

  const handleLikeDiscussion = useCallback(
    async (id: string) => {
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
    [refreshAfterAction, showToast],
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
        showToast(data.saved ? "Publicação salva!" : "Removida dos salvos.");
        void refreshAfterAction();
      } else {
        showToast(data?.error?.message || "Não foi possível salvar.");
      }
    },
    [refreshAfterAction, showToast],
  );

  const handleOpenDiscussion = useCallback(
    (id: string) => {
      router.push(comunidadeRoutes.discussao(id, embedded));
    },
    [router, embedded],
  );

  const submitComment = useCallback(
    async (id: string, body: string) => {
      try {
        const response = await fetch("/api/community/docente/actions", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "comment_post", postId: id, body }),
        });
        const data = await response.json();
        if (response.ok && data.ok) {
          setDiscussions((prev) =>
            prev.map((d) => (d.id === id ? { ...d, commentsCount: data.commentsCount } : d)),
          );
          showToast("Comentário publicado!");
          void refreshAfterAction();
        } else {
          showToast(data?.error?.message || "Não foi possível comentar.");
        }
      } catch {
        showToast("Não foi possível comentar.");
      }
    },
    [refreshAfterAction, showToast],
  );

  const handleShareDiscussion = useCallback(
    (id: string) => {
      const url = `${window.location.origin}${comunidadeRoutes.discussao(id, embedded)}`;
      void navigator.clipboard.writeText(url).then(() => {
        showToast("Link copiado para a área de transferência!");
      });
    },
    [embedded, showToast],
  );

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
          prev.map((m) =>
            m.id === id
              ? {
                  ...m,
                  viewsCount: m.viewsCount + 1,
                  downloadsCount: (m.downloadsCount ?? m.viewsCount) + 1,
                }
              : m,
          ),
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
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (data.following) next.add(authorId);
        else next.delete(authorId);
        return next;
      });
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
        await loadOverview(effectiveSearch, { silent: true });
      } catch (error) {
        throw error instanceof Error ? error : new Error("create_post_failed");
      }
    },
    [effectiveSearch, loadOverview, showToast, viewerName],
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
        await loadOverview(effectiveSearch, { silent: true });
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
        await loadOverview(effectiveSearch, { silent: true });
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
      await loadOverview(effectiveSearch, { silent: true });
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
      await loadOverview(effectiveSearch, { silent: true });
    } catch {
      setHiddenMaterialIdsState((current) => new Set([...current, id]));
      setHiddenRevision((v) => v + 1);
      showToast("Não foi possível restaurar no servidor.");
    }
  }, [effectiveSearch, loadOverview, showToast]);

  const openCreatePost = useCallback((intent: ComposerIntent = "texto") => {
    setCreatePostIntent(intent);
    setCreatePostOpen(true);
  }, []);
  const openOwnProfile = useCallback(() => {
    if (!viewerProfile?.userId) return;
    router.push(comunidadeRoutes.professor(viewerProfile.userId, embedded));
  }, [router, viewerProfile?.userId, embedded]);

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
          embedded={embedded}
          onLike={handleLikeMaterial}
          onSave={handleSaveMaterial}
          onSaveDiscussion={handleSaveDiscussion}
          onOpenDiscussion={handleOpenDiscussion}
          onOpenMaterial={setPreviewMaterialId}
          onDownload={handleDownloadMaterial}
          downloadingMaterialId={downloadingMaterialId}
          onBrowseMaterials={() => setActiveMenu("inicio")}
        />
      );
    }

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
        <ComunidadeDocenteFeedFilters
          mineOnly={mineOnly}
          friendsOnly={friendsOnly}
          savedOnly={savedOnly}
          showHidden={showHidden}
          selectedDisciplina={selectedDisciplina}
          anoSerie={anoSerieFilter}
          tipoMaterial={tipoMaterialFilter}
          searchQuery={searchQuery}
          onToggleMineOnly={() => setMineOnly((v) => !v)}
          onToggleFriendsOnly={() => setFriendsOnly((v) => !v)}
          onToggleSavedOnly={() => setSavedOnly((v) => !v)}
          onToggleShowHidden={() => setShowHidden((v) => !v)}
          onSelectDisciplina={setSelectedDisciplina}
          onAnoSerieChange={setAnoSerieFilter}
          onTipoMaterialChange={setTipoMaterialFilter}
          onSearchChange={setSearchQuery}
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
        <ComunidadeDocenteMaterials
          materials={filteredMaterials}
          embedded={embedded}
          showHidden={showHidden}
          downloadingMaterialId={downloadingMaterialId}
          onOpen={setPreviewMaterialId}
          onLike={handleLikeMaterial}
          onSave={handleSaveMaterial}
          onDownload={handleDownloadMaterial}
          onHideMaterial={handleHideMaterial}
          onUnhideMaterial={handleUnhideMaterial}
          onCreateMaterial={() => openCreatePost("materiais")}
          title="Materiais da Comunidade"
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
    );
  };

  const openMessagesPanel = searchParams.get("painel") === "mensagens";
  const showRightSidebar = activeMenu === "inicio" || activeMenu === "salvos" || activeMenu === "desafios";

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
        }}
        onSearchSubmit={(value) => {
          const q = value.trim();
          if (q.length >= 2) {
            router.push(buscaHref(q, embedded));
          } else if (!q) {
            void loadOverview("", { silent: true });
          }
        }}
        onCreatePost={openCreatePost}
        onSelectMenu={navigateToMenu}
        activeMenu={activeMenu}
        initialOpenMessages={openMessagesPanel}
      />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
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
        }}
      />

      <ComunidadeDocenteCreatePostModal
        open={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        onSubmit={handleCreatePost}
        intent={createPostIntent}
        viewerName={viewerName}
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
