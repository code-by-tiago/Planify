export type SchoolTeacherMember = {
  id: string;
  userId: string;
  role: string;
  status: string;
  email: string | null;
  fullName: string | null;
  createdAt: string;
};

export type SchoolPendingInvite = {
  id: string;
  email: string;
  status: string;
  createdAt: string;
};

export type SchoolLicenseSummary = {
  institutionalPlan: string | null;
  planLabel: string | null;
  teacherLimit: number | null;
  activeTeachers: number;
  pendingInvites: number;
  seatsUsed: number;
  seatsAvailable: number | null;
};

export type SchoolTeachersResponse = {
  schoolId: string;
  activeTeachers: SchoolTeacherMember[];
  pendingInvites: SchoolPendingInvite[];
  license: SchoolLicenseSummary;
};

export type SchoolClassItem = {
  id: string;
  name: string;
  gradeLevel: string | null;
  year: number | null;
  discipline: string | null;
  teacherUserId: string | null;
  teacherName: string | null;
  teacherEmail: string | null;
  createdAt: string;
};

export type SchoolClassesResponse = {
  schoolId: string;
  classes: SchoolClassItem[];
};

export type SchoolMaterialAuditRow = {
  id: string;
  professorName: string | null;
  professorEmail: string | null;
  title: string;
  tipo: string;
  className: string | null;
  discipline: string | null;
  bnccSkillCodes: string[];
  createdAt: string;
};

export type SchoolMaterialsResponse = {
  schoolId: string;
  schoolName: string;
  materials: SchoolMaterialAuditRow[];
  total: number;
  professors: Array<{ userId: string; name: string; email: string | null }>;
  disciplines: string[];
};
