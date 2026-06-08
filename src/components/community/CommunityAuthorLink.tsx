"use client";

import Link from "next/link";

type CommunityAuthorLinkProps = {
  userId?: string | null;
  name: string;
  className?: string;
};

export function communityProfileHref(userId: string) {
  return `/marketplace/perfil/${userId}`;
}

export function CommunityAuthorLink({
  userId,
  name,
  className = "",
}: CommunityAuthorLinkProps) {
  if (!userId) {
    return <span className={className}>{name}</span>;
  }

  return (
    <Link
      href={communityProfileHref(userId)}
      className={`font-bold text-cyan-800 transition hover:text-cyan-600 hover:underline ${className}`}
    >
      {name}
    </Link>
  );
}
