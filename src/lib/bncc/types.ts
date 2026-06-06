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
    classId: string | null;
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
  totalSkills: number;
  materialsThisMonth: number;
};

export type SchoolDashboardResponse = {
  schoolId: string;
  schoolName: string;
  activeTeachers: number;
  avgBnccCompliance: number;
  materialsThisMonth: number;
  classes: SchoolClassBnccRow[];
};
