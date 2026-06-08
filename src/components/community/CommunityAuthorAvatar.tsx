"use client";

import Link from "next/link";
import { communityProfileHref } from "@/components/community/CommunityAuthorLink";
import { useEffect, useState } from "react";

type CommunityAuthorAvatarProps = {
  userId?: string | null;
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md";
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "PL";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
}

export function CommunityAuthorAvatar({
  userId,
  name,
  avatarUrl,
  size = "md",
}: CommunityAuthorAvatarProps) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const dimension = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  const profileLabel = userId ? `Ver perfil de ${name}` : undefined;

  useEffect(() => {
    setPhotoFailed(false);
  }, [avatarUrl]);

  const showPhoto = Boolean(avatarUrl) && !photoFailed;

  const inner = showPhoto ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl!}
      alt=""
      className="h-full w-full object-cover"
      onError={() => setPhotoFailed(true)}
    />
  ) : (
    <span
      aria-hidden={Boolean(userId)}
      className={`flex h-full w-full items-center justify-center font-black text-white ${textSize}`}
    >
      {initialsFromName(name)}
    </span>
  );

  const className = `${dimension} shrink-0 overflow-hidden rounded-full border-2 border-white bg-gradient-to-br from-cyan-500 to-indigo-500 shadow-sm`;

  if (!userId) {
    return (
      <div className={className} title={name}>
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={communityProfileHref(userId)}
      title={profileLabel}
      aria-label={profileLabel}
      className={`${className} transition hover:brightness-105`}
    >
      {inner}
    </Link>
  );
}
