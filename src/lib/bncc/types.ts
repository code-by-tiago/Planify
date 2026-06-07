export type BnccSkillSummary = {
  code: string;
  description: string;
  subject: string | null;
  grade: string | null;
  educationStage: string | null;
};

export type BnccCoveredSkill = BnccSkillSummary & {
  coveredAt: string;
  materialId: string;
  materialTitle: string;
};

export type BnccProgressResponse = {
  coveragePercent: number;
  totalSkills: number;
  coveredCount: number;
  pendingCount: number;
  covered: BnccCoveredSkill[];
  pending: BnccSkillSummary[];
  classes: Array<{
    id: string;
    name: string;
    gradeLevel: string | null;
    discipline: string | null;
    year: number | null;
  }>;
  disciplines: string[];
  filters: {
    classFilter: string | null;
    classId: string | null;
    className: string | null;
    discipline: string | null;
    grade: string | null;
    year: number | null;
  };
};

export type SchoolClassBnccRow = {
  classId: string;
  className: string;
  gradeLevel: string | null;
  discipline: string | null;
  teacherName: string | null;
  coveragePercent: number;
  coveredCount: number;
  pendingCount: number;
  totalSkills: number;
  materialsThisMonth: number;
  pendingSkills: BnccSkillSummary[];
};

export type TeacherProductivityRow = {
  userId: string;
  name: string;
  email: string | null;
  materialsThisMonth: number;
  materialsTotal: number;
  planningsThisMonth: number;
  planningsTotal: number;
  lastActivityAt: string | null;
};

export type SchoolDashboardResponse = {
  schoolId: string;
  schoolName: string;
  activeTeachers: number;
  avgBnccCompliance: number;
  materialsThisMonth: number;
  classes: SchoolClassBnccRow[];
  teacherProductivity: TeacherProductivityRow[];
  atRiskClasses: Array<{
    classId: string;
    className: string;
    coveragePercent: number;
    pendingCount: number;
  }>;
};
