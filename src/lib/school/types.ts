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

export type SchoolTeachersResponse = {
  schoolId: string;
  activeTeachers: SchoolTeacherMember[];
  pendingInvites: SchoolPendingInvite[];
};
