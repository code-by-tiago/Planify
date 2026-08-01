export type DocenteMenuItem =
  | "inicio"
<<<<<<< HEAD
  | "discussoes"
  | "materiais"
  | "eventos"
  | "grupos"
=======
>>>>>>> origin/aplicar-melhorias-na-producao
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

<<<<<<< HEAD
=======
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

>>>>>>> origin/aplicar-melhorias-na-producao
export type DocenteDiscussion = {
  id: string;
  author: DocenteAuthor;
  title: string;
<<<<<<< HEAD
=======
  body?: string;
>>>>>>> origin/aplicar-melhorias-na-producao
  disciplina: DocenteDisciplina;
  tags: string[];
  createdAt: string;
  commentsCount: number;
  likesCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
<<<<<<< HEAD
=======
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
>>>>>>> origin/aplicar-melhorias-na-producao
};

export type DocenteMaterial = {
  id: string;
  title: string;
  disciplina: DocenteDisciplina;
  anoSerie: string;
  author: DocenteAuthor;
  tipoMaterial: string;
  componenteRaw?: string;
<<<<<<< HEAD
  /** @deprecated Use MaterialTypeCover with tipoMaterial instead */
  coverUrl?: string;
  viewsCount: number;
=======
  tags: string[];
  /** @deprecated Use MaterialTypeCover with tipoMaterial instead */
  coverUrl?: string;
  /** Contagem de usos/clones (downloads_count no backend). */
  viewsCount: number;
  downloadsCount: number;
>>>>>>> origin/aplicar-melhorias-na-producao
  likesCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  fileType: "pdf" | "docx" | "pptx" | "image";
<<<<<<< HEAD
=======
  /** Conteúdo importado/destacado pelo admin (abre fora do site). */
  externalUrl?: string | null;
  featuredSource?: "admin" | "import" | "community" | "external" | null;
>>>>>>> origin/aplicar-melhorias-na-producao
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

<<<<<<< HEAD
export type DocenteEvent = {
  id: string;
  title: string;
  presenterName: string;
  startsAt: string;
  isOnline: boolean;
  day: number;
  month: string;
};

=======
>>>>>>> origin/aplicar-melhorias-na-producao
export type DocenteStats = {
  activeTeachers: number;
  sharedMaterials: number;
  openDiscussions: number;
<<<<<<< HEAD
  studyGroups: number;
=======
>>>>>>> origin/aplicar-melhorias-na-producao
};

export type DocenteCreatePostInput = {
  title: string;
  body: string;
  disciplina: DocenteDisciplina;
  tags: string[];
  files: File[];
  participantUserIds?: string[];
<<<<<<< HEAD
  groupId?: string;
};

export type DocenteCreateGroupInput = {
  name: string;
  description: string;
  disciplina: DocenteDisciplina;
  memberUserIds?: string[];
=======
>>>>>>> origin/aplicar-melhorias-na-producao
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
