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
  | "Educação Física";

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
  coverUrl: string;
  viewsCount: number;
  likesCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  fileType: "pdf" | "docx" | "pptx" | "image";
};

export type DocenteRecentPublication = {
  id: string;
  title: string;
  thumbnailUrl: string;
  authorName: string;
  createdAt: string;
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
};
