"use client";

import Link from "next/link";
import { comunidadeRoutes } from "@/lib/community/docente-utils";
import { useComunidadeEmbedded } from "@/hooks/useComunidadeEmbedded";

type CommunityAuthorLinkProps = {
  userId?: string | null;
  name: string;
  className?: string;
  embedded?: boolean;
};

export function communityProfileHref(userId: string, embedded?: boolean) {
  return comunidadeRoutes.professor(userId, embedded);
}

export function CommunityAuthorLink({
  userId,
  name,
  className = "",
  embedded: embeddedProp,
}: CommunityAuthorLinkProps) {
  const embeddedFromContext = useComunidadeEmbedded();
  const embedded = embeddedProp ?? embeddedFromContext;

  if (!userId) {
    return <span className={className}>{name}</span>;
  }

  return (
    <Link
      href={communityProfileHref(userId, embedded)}
      className={`font-bold text-cyan-800 transition hover:text-cyan-600 hover:underline ${className}`}
    >
      {name}
    </Link>
  );
}
