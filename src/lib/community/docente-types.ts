export type DocenteMenuItem =
  | "inicio"
  | "professores"
  | "desafios"
  | "salvos";

export type DocenteDisciplina =
  | "Língua Portuguesa"
  | "Matemática"
  | "Ciências"
  | "História"
  | "Geografia"
  | "Inglês"
  | "Artes"
  | "Educação Física"
  | "Multidisciplinar";

export type DocenteAuthor = {
  id: string;
  name: string;
  avatarUrl: string | null;
  specialty: string;
  materialsCount: number;
  followersCount: number;
  reputation: number;
  badges: string[];
  isFollowing?: boolean;
};

export type DocenteDiscussionAttachment = {
  id: string;
  materialId: string;
  title: string;
  fileName: string;
  fileType: "pdf" | "docx" | "pptx" | "image";
  fileMime?: string | null;
  /** URL assinada para exibir imagem inline no feed. */
  previewUrl?: string | null;
};

export type DocenteAchievementBadge = {
  name: string;
  color: string;
  icon: string;
};

export type DocenteDiscussion = {
  id: string;
  author: DocenteAuthor;
  title: string;
  body?: string;
  disciplina: DocenteDisciplina;
  tags: string[];
  createdAt: string;
  commentsCount: number;
  likesCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  /** "text" para publicações comuns, "achievement" para conquistas (selos). */
  kind?: "text" | "achievement";
  achievementBadge?: DocenteAchievementBadge;
  /** Prévia de comentários no feed (evita N+1). */
  commentsPreview?: DocenteComment[];
  attachments?: DocenteDiscussionAttachment[];
};

export type DocenteComment = {
  id: string;
  body: string;
  createdAt: string;
  author: DocenteAuthor;
};

export type DocenteMaterial = {
  id: string;
  title: string;
  disciplina: DocenteDisciplina;
  anoSerie: string;
  author: DocenteAuthor;
  tipoMaterial: string;
  componenteRaw?: string;
  tags: string[];
  /** @deprecated Use MaterialTypeCover with tipoMaterial instead */
  coverUrl?: string;
  /** Contagem de usos/clones (downloads_count no backend). */
  viewsCount: number;
  downloadsCount: number;
  likesCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  fileType: "pdf" | "docx" | "pptx" | "image";
  /** Conteúdo importado/destacado pelo admin (abre fora do site). */
  externalUrl?: string | null;
  featuredSource?: "admin" | "import" | "community" | "external" | null;
};

export type DocenteRecentPublication = {
  id: string;
  title: string;
  tipoMaterial: string;
  disciplina?: DocenteDisciplina;
  /** @deprecated Use MaterialTypeCover with tipoMaterial instead */
  thumbnailUrl?: string;
  authorName: string;
  createdAt: string;
  href?: string;
};

export type DocenteStats = {
  activeTeachers: number;
  sharedMaterials: number;
  openDiscussions: number;
};

export type DocenteCreatePostInput = {
  title: string;
  body: string;
  disciplina: DocenteDisciplina;
  tags: string[];
  files: File[];
  participantUserIds?: string[];
};

export type DocenteBadgeProgress = {
  id: string;
  slug: string;
  name: string;
  description: string;
  color: string;
  minReputation: number;
  earned: boolean;
  awardedAt: string | null;
  progress: {
    current: number;
    target: number;
    label: string;
  }[];
};
