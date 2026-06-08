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
  signedUrl: string | null;
  createdAt: string | null;
};
