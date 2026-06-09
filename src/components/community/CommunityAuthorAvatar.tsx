"use client";

import Link from "next/link";
import { communityProfileHref } from "@/components/community/CommunityAuthorLink";
import { PlanifyOwlMark } from "@/components/pro/PlanifyOwlMark";
import { useEffect, useState } from "react";

type CommunityAuthorAvatarProps = {
  userId?: string | null;
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md";
};

function owlSizeForAvatar(size: "sm" | "md"): number {
  return size === "sm" ? 36 : 44;
}

export function CommunityAuthorAvatar({
  userId,
  name,
  avatarUrl,
  size = "md",
}: CommunityAuthorAvatarProps) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const dimension = size === "sm" ? "h-9 w-9" : "h-11 w-11";
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
    <span className="flex h-full w-full items-center justify-center bg-slate-900/5">
      <PlanifyOwlMark size={owlSizeForAvatar(size)} />
    </span>
  );

  const className = `${dimension} shrink-0 overflow-hidden rounded-full border-2 border-white bg-white shadow-sm`;

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
