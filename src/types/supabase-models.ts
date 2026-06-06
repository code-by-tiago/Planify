import type { Tables, TablesInsert, TablesUpdate } from "./database";

export type ProfileRow = Tables<"profiles">;
export type ProfileInsert = TablesInsert<"profiles">;
export type ProfileUpdate = TablesUpdate<"profiles">;

export type PlanRow = Tables<"plans">;
export type PlanInsert = TablesInsert<"plans">;
export type PlanUpdate = TablesUpdate<"plans">;

export type SubscriptionRow = Tables<"subscriptions">;
export type SubscriptionInsert = TablesInsert<"subscriptions">;
export type SubscriptionUpdate = TablesUpdate<"subscriptions">;

export type DocumentRow = Tables<"documents">;
export type DocumentInsert = TablesInsert<"documents">;
export type DocumentUpdate = TablesUpdate<"documents">;

export type LessonPlanRow = Tables<"lesson_plans">;
export type LessonPlanInsert = TablesInsert<"lesson_plans">;
export type LessonPlanUpdate = TablesUpdate<"lesson_plans">;

export type TeachingMaterialRow = Tables<"teaching_materials">;
export type TeachingMaterialInsert = TablesInsert<"teaching_materials">;
export type TeachingMaterialUpdate = TablesUpdate<"teaching_materials">;

export type BnccSkillRow = Tables<"bncc_skills">;
export type BnccSkillInsert = TablesInsert<"bncc_skills">;
export type BnccSkillUpdate = TablesUpdate<"bncc_skills">;

export type UserHistoryRow = Tables<"user_history">;
export type UserHistoryInsert = TablesInsert<"user_history">;
export type UserHistoryUpdate = TablesUpdate<"user_history">;

export type MarketplaceItemRow = Tables<"marketplace_items">;
export type MarketplaceItemInsert = TablesInsert<"marketplace_items">;
export type MarketplaceItemUpdate = TablesUpdate<"marketplace_items">;

export type LibraryItemRow = Tables<"library_items">;
export type LibraryItemInsert = TablesInsert<"library_items">;
export type LibraryItemUpdate = TablesUpdate<"library_items">;

export type SchoolRow = Tables<"schools">;
export type SchoolInsert = TablesInsert<"schools">;
export type SchoolUpdate = TablesUpdate<"schools">;

export type SchoolClassRow = Tables<"school_classes">;
export type SchoolClassInsert = TablesInsert<"school_classes">;
export type SchoolClassUpdate = TablesUpdate<"school_classes">;

export type SchoolMembershipRow = Tables<"school_memberships">;
export type SchoolMembershipInsert = TablesInsert<"school_memberships">;
export type SchoolMembershipUpdate = TablesUpdate<"school_memberships">;

export type GeneratedMaterialRow = Tables<"generated_materials">;
export type GeneratedMaterialInsert = TablesInsert<"generated_materials">;
export type GeneratedMaterialUpdate = TablesUpdate<"generated_materials">;
