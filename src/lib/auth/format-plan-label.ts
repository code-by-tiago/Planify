export function formatDisplayNameFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim();
  if (!local) return "Professora";

  const cleaned = local.replace(/[._-]+/g, " ");
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function formatPlanLabel(
  planKey: string | null | undefined,
  options?: { isAdmin?: boolean; isOwner?: boolean },
): string {
  if (options?.isOwner) return "Proprietário";
  if (options?.isAdmin) return "Administrador";
  if (!planKey) return "Premium ativo";

  const labels: Record<string, string> = {
    professor_pro: "Professor Pro",
    professor_pro_anual: "Professor Pro Anual",
    professor_premium: "Professor Premium",
    monthly: "Pro Mensal",
    yearly: "Pro Anual",
    premium: "Premium",
  };

  return labels[planKey] || planKey.replace(/_/g, " ");
}
