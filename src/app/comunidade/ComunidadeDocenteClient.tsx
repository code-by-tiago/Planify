"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  DocenteCreatePostInput,
  DocenteDiscussion,
  DocenteEvent,
  DocenteMaterial,
  DocenteMenuItem,
  DocenteRecentPublication,
  DocenteStats,
} from "@/lib/community/docente-types";

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
  }>;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    color: string;
    min_reputation: number;
  }>;
  featuredTeacher: DocenteAuthor | null;
  teachers: DocenteAuthor[];
};

export function ComunidadeDocenteClient({ embedded = false }: { embedded?: boolean }) {
  const [activeMenu, setActiveMenu] = useState<DocenteMenuItem>("inicio");
  const [searchQuery, setSearchQuery] = useState("");
  const [heroSearch, setHeroSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [stats, setStats] = useState<DocenteStats>(EMPTY_STATS);
  const [discussions, setDiscussions] = useState<DocenteDiscussion[]>([]);
  const [materials, setMaterials] = useState<DocenteMaterial[]>([]);
  const [recentPublications, setRecentPublications] = useState<DocenteRecentPublication[]>([]);
  const [events, setEvents] = useState<DocenteEvent[]>([]);
  const [groups, setGroups] = useState<OverviewPayload["groups"]>([]);
  const [badges, setBadges] = useState<OverviewPayload["badges"]>([]);
  const [featuredTeacher, setFeaturedTeacher] = useState<DocenteAuthor | null>(null);
  const [teachers, setTeachers] = useState<DocenteAuthor[]>([]);

  const effectiveSearch = searchQuery || heroSearch;

  const filteredDiscussions = useMemo(() => {
    if (!effectiveSearch.trim()) return discussions;
    const q = effectiveSearch.toLowerCase();
    return discussions.filter((d) =>
      `${d.title} ${d.author.name} ${d.disciplina} ${d.tags.join(" ")}`.toLowerCase().includes(q),
    );
  }, [discussions, effectiveSearch]);

  const filteredMaterials = useMemo(() => {
    if (!effectiveSearch.trim()) return materials;
    const q = effectiveSearch.toLowerCase();
    return materials.filter((m) =>
      `${m.title} ${m.author.name} ${m.disciplina}`.toLowerCase().includes(q),
    );
  }, [materials, effectiveSearch]);

  const showToast = useCallback((message: string) => {
    setStatus(message);
    window.setTimeout(() => setStatus(""), 3200);
  }, []);

  const loadOverview = useCallback(async (search = "") => {
    setLoading(true);
    setLoadError("");
    // #region agent log
    fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "40dc8d" },
      body: JSON.stringify({
        sessionId: "40dc8d",
        hypothesisId: "D",
        location: "ComunidadeDocenteClient.tsx:loadOverview:start",
        message: "Fetching community overview",
        data: { search, embedded },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

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
      setDiscussions(data.discussions || []);
      setMaterials(data.materials || []);
      setRecentPublications(data.recentPublications || []);
      setEvents(data.events || []);
      setGroups(data.groups || []);
      setBadges(data.badges || []);
      setFeaturedTeacher(data.featuredTeacher || null);
      setTeachers(data.teachers || []);

      // #region agent log
      fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "40dc8d" },
        body: JSON.stringify({
          sessionId: "40dc8d",
          hypothesisId: "D",
          location: "ComunidadeDocenteClient.tsx:loadOverview:success",
          message: "Overview loaded",
          data: {
            discussions: (data.discussions || []).length,
            materials: (data.materials || []).length,
            events: (data.events || []).length,
            groups: (data.groups || []).length,
            badges: (data.badges || []).length,
            teachers: (data.teachers || []).length,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao carregar comunidade.";
      setLoadError(message);
      // #region agent log
      fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "40dc8d" },
        body: JSON.stringify({
          sessionId: "40dc8d",
          hypothesisId: "C",
          location: "ComunidadeDocenteClient.tsx:loadOverview:error",
          message: "Overview load failed",
          data: { error: message },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    } finally {
      setLoading(false);
    }
  }, [embedded]);

  useEffect(() => {
    // #region agent log
    fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "40dc8d" },
      body: JSON.stringify({
        sessionId: "40dc8d",
        hypothesisId: "A",
        location: "ComunidadeDocenteClient.tsx:mount",
        message: "Comunidade Docente mounted",
        data: { embedded, activeMenu },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    void loadOverview();
  }, [loadOverview, embedded]);

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
      }
    },
    [discussions],
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
      }
    },
    [materials, showToast],
  );

  const handleSaveDiscussion = useCallback(
    async (id: string) => {
      if (!isMaterialDiscussion(id)) {
        setDiscussions((prev) =>
          prev.map((d) => (d.id === id ? { ...d, savedByMe: !d.savedByMe } : d)),
        );
        showToast("Discussão salva!");
        return;
      }
      await handleSaveMaterial(materialIdFromDiscussion(id));
    },
    [handleSaveMaterial, showToast],
  );

  const handleCommentDiscussion = useCallback(
    async (id: string) => {
      const body = window.prompt("Escreva seu comentário:");
      if (!body?.trim()) return;

      if (isMaterialDiscussion(id)) {
        const materialId = materialIdFromDiscussion(id);
        const response = await fetch(`/api/marketplace/materiais/${materialId}/comentarios`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: body.trim() }),
        });
        if (response.ok) {
          setDiscussions((prev) =>
            prev.map((d) =>
              d.id === id ? { ...d, commentsCount: d.commentsCount + 1 } : d,
            ),
          );
          showToast("Comentário publicado!");
        }
        return;
      }

      const response = await fetch("/api/community/docente/actions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "comment_post", postId: id, body: body.trim() }),
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        setDiscussions((prev) =>
          prev.map((d) =>
            d.id === id ? { ...d, commentsCount: data.commentsCount } : d,
          ),
        );
        showToast("Comentário publicado!");
      }
    },
    [showToast],
  );

  const handleShareDiscussion = useCallback(
    (id: string) => {
      const url = `${window.location.origin}/comunidade?discussao=${id}`;
      void navigator.clipboard.writeText(url).then(() => {
        showToast("Link copiado para a área de transferência!");
      });
    },
    [showToast],
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
    }
  }, [materials]);

  const handleFollowTeacher = useCallback(
    async (authorId: string) => {
      const response = await fetch("/api/community/docente/actions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "follow", followingId: authorId }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) return;

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
        }),
      });
      const data = await response.json();

      if (response.ok && data.ok) {
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
            form.set("authorName", "Professor");
            form.set("isPublished", "true");
            form.set("file", file);
            await fetch("/api/marketplace/materiais", {
              method: "POST",
              body: form,
              credentials: "include",
            });
          }
        }
        showToast("Publicação criada com sucesso!");
        await loadOverview(effectiveSearch);
      } else {
        showToast(data?.error?.message || "Não foi possível publicar.");
      }
    },
    [effectiveSearch, loadOverview, showToast],
  );

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

    // #region agent log
    fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "40dc8d" },
      body: JSON.stringify({
        sessionId: "40dc8d",
        hypothesisId: "A",
        location: "ComunidadeDocenteClient.tsx:renderMainContent",
        message: "Rendering section",
        data: { activeMenu, hasPlaceholder: false },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (activeMenu === "eventos") {
      return <ComunidadeDocenteEventos events={events} />;
    }
    if (activeMenu === "grupos") {
      return <ComunidadeDocenteGrupos groups={groups} />;
    }
    if (activeMenu === "professores") {
      return (
        <ComunidadeDocenteProfessores teachers={teachers} onFollow={handleFollowTeacher} />
      );
    }
    if (activeMenu === "desafios") {
      return <ComunidadeDocenteDesafios badges={badges} />;
    }
    if (activeMenu === "salvos") {
      return (
        <ComunidadeDocenteSalvos
          materials={materials}
          onLike={handleLikeMaterial}
          onSave={handleSaveMaterial}
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
          />
        )}

        {(activeMenu === "inicio" || activeMenu === "materiais") && (
          <ComunidadeDocenteMaterials
            materials={filteredMaterials}
            onLike={handleLikeMaterial}
            onSave={handleSaveMaterial}
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
        onCreatePost={() => setCreatePostOpen(true)}
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
          onSelectItem={setActiveMenu}
          onClose={() => setSidebarOpen(false)}
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
              />
            </div>
          </main>

          <div className="hidden shrink-0 overflow-y-auto border-l border-slate-200/80 bg-[#f8fafc] p-5 xl:block">
            <ComunidadeDocenteRightSidebar
              featuredTeacher={featuredTeacher}
              recentPublications={recentPublications}
              events={events}
              onFollow={handleFollowTeacher}
            />
          </div>
        </div>
      </div>

      <ComunidadeDocenteCreatePostModal
        open={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        onSubmit={handleCreatePost}
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
