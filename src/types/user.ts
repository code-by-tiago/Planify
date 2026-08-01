export type UserRole = "owner" | "admin" | "teacher" | "school_manager";

export type UserStatus = "active" | "inactive" | "pending" | "blocked";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  planId?: string;
  schoolName?: string;
  createdAt: string;
  updatedAt: string;
};

export type TeacherProfile = UserProfile & {
  role: "teacher";
  subjects: string[];
  educationStages: string[];
};