import type { Json } from "./database";

export type SchoolMembershipRole = "director" | "teacher" | "coordinator";
export type SchoolMembershipStatus = "active" | "inactive";

export type SchoolContext = {
  school: {
    id: string;
    name: string;
    slug: string | null;
    city: string | null;
    state: string | null;
    director_user_id: string | null;
    metadata: Json;
    created_at: string;
    updated_at: string;
  } | null;
  membership: {
    id: string;
    school_id: string;
    user_id: string;
    role: SchoolMembershipRole;
    status: SchoolMembershipStatus;
    created_at: string;
    updated_at: string;
  } | null;
  classes: Array<{
    id: string;
    school_id: string;
    name: string;
    grade_level: string | null;
    year: number | null;
    discipline: string | null;
    teacher_user_id: string | null;
    created_at: string;
  }>;
};

export type CreateSchoolInput = {
  name: string;
  slug?: string | null;
  city?: string | null;
  state?: string | null;
  metadata?: Json;
};

export type CreateSchoolClassInput = {
  name: string;
  gradeLevel?: string | null;
  year?: number | null;
  discipline?: string | null;
  teacherUserId?: string | null;
};

export type UpdateSchoolClassInput = {
  name?: string;
  gradeLevel?: string | null;
  year?: number | null;
  discipline?: string | null;
  teacherUserId?: string | null;
};

export type CreateSchoolMemberInput = {
  userId: string;
  role: SchoolMembershipRole;
  status?: SchoolMembershipStatus;
};
