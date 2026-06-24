export type DocenteMenuItem =
  | "inicio"
  | "discussoes"
  | "materiais"
  | "eventos"
  | "grupos"
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

export type DocenteDiscussion = {
  id: string;
  author: DocenteAuthor;
  title: string;
  disciplina: DocenteDisciplina;
  tags: string[];
  createdAt: string;
  commentsCount: number;
  likesCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
};

export type DocenteMaterial = {
  id: string;
  title: string;
  disciplina: DocenteDisciplina;
  anoSerie: string;
  author: DocenteAuthor;
  tipoMaterial: string;
  componenteRaw?: string;
  /** @deprecated Use MaterialTypeCover with tipoMaterial instead */
  coverUrl?: string;
  viewsCount: number;
  likesCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  fileType: "pdf" | "docx" | "pptx" | "image";
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

export type DocenteEvent = {
  id: string;
  title: string;
  presenterName: string;
  startsAt: string;
  isOnline: boolean;
  day: number;
  month: string;
};

export type DocenteStats = {
  activeTeachers: number;
  sharedMaterials: number;
  openDiscussions: number;
  studyGroups: number;
};

export type DocenteCreatePostInput = {
  title: string;
  body: string;
  disciplina: DocenteDisciplina;
  tags: string[];
  files: File[];
  participantUserIds?: string[];
  groupId?: string;
};

export type DocenteCreateGroupInput = {
  name: string;
  description: string;
  disciplina: DocenteDisciplina;
  memberUserIds?: string[];
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
