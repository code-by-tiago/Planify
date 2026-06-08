export type FriendshipStatus =
  | "none"
  | "pending_outgoing"
  | "pending_incoming"
  | "accepted"
  | "declined"
  | "blocked";

export type CommunityFriendSummary = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  friendshipId: string;
  since: string;
};

export type CommunityMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export type CommunityConversationSummary = {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatarUrl: string | null;
  lastMessageBody: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

export type CommunityMaterialComment = {
  id: string;
  userId: string | null;
  authorName: string;
  authorAvatarUrl: string | null;
  body: string;
  createdAt: string;
};

export type CommunityNotificationType =
  | "comment"
  | "like"
  | "friend_request"
  | "friend_accepted"
  | "message";

export type CommunityNotification = {
  id: string;
  type: CommunityNotificationType;
  actorUserId: string;
  actorName: string;
  actorAvatarUrl: string | null;
  materialId: string | null;
  conversationId: string | null;
  friendshipId: string | null;
  bodyPreview: string;
  readAt: string | null;
  createdAt: string;
};

export type CommunityProfileSearchResult = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  schoolName: string | null;
  bio: string | null;
  topComponente: string | null;
  materialsCount: number;
};

export type CommunityPendingFriend = CommunityFriendSummary & {
  direction: "incoming" | "outgoing";
};

export type CommunityFeedItem = {
  id: string;
  userId: string;
  ownerEmail: string;
  authorName: string;
  authorAvatarUrl: string | null;
  title: string;
  description: string;
  etapa: string;
  anoSerie: string;
  componente: string;
  tipoMaterial: string;
  tema: string;
  tags: string[];
  fileName: string;
  fileMime: string;
  fileSize: number;
  isPublished: boolean;
  downloadsCount: number;
  likesCount: number;
  likedByMe: boolean;
  savedByMe?: boolean;
  commentsCount: number;
  comments: CommunityMaterialComment[];
  signedUrl: string | null;
  createdAt: string | null;
};
