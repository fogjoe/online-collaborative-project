// WebSocket Event Types for Real-Time Board Collaboration

export enum WebSocketEvents {
  // Connection events
  JOIN_PROJECT = 'join:project',
  LEAVE_PROJECT = 'leave:project',

  // Card events
  CARD_CREATED = 'card:created',
  CARD_UPDATED = 'card:updated',
  CARD_MOVED = 'card:moved',
  CARD_DELETED = 'card:deleted',

  // Comment events
  COMMENT_ADDED = 'comment:added',

  // Member events
  MEMBER_JOINED = 'member:joined',

  // List events
  LIST_CREATED = 'list:created',

  // Presence events
  USER_JOINED_BOARD = 'presence:user_joined',
  USER_LEFT_BOARD = 'presence:user_left',
  BOARD_USERS = 'presence:board_users',
  ATTACHMENTS_UPDATED = 'attachment:updated',
}

export interface BoardUser {
  userId: number;
  username: string;
  avatarUrl?: string;
  joinedAt: Date;
}

export interface JoinProjectPayload {
  projectId: number;
}

export interface LeaveProjectPayload {
  projectId: number;
}

export interface CardCreatedPayload {
  projectId: number;
  listId: number;
  card: {
    id: number;
    title: string;
    description?: string;
    order: number;
    isCompleted: boolean;
    dueDate?: Date | string | null;
    assignees: Array<{
      id: number;
      username: string;
      avatarUrl?: string;
    }>;
    labels: Array<{
      id: number;
      name: string;
      color: string;
    }>;
    attachments: Array<{
      id: number;
      originalName: string;
      url: string;
    }>;
  };
  actor: {
    id: number;
    username: string;
  };
}

export interface CardUpdatedPayload {
  projectId: number;
  cardId: number;
  updates: {
    title?: string;
    description?: string;
    isCompleted?: boolean;
    labelIds?: number[];
    labels?: Array<{
      id: number;
      name: string;
      color: string;
    }>;
    attachments?: AttachmentPayload[];
    dueDate?: Date | string | null;
  };
  actor: {
    id: number;
    username: string;
  };
}

export interface CardMovedPayload {
  projectId: number;
  cardId: number;
  fromListId: number;
  toListId: number;
  newOrder: number;
  actor: {
    id: number;
    username: string;
  };
}

export interface CardDeletedPayload {
  projectId: number;
  cardId: number;
  listId: number;
  actor: {
    id: number;
    username: string;
  };
}

export interface CommentAddedPayload {
  projectId: number;
  cardId: number;
  comment: {
    id: number;
    content: string;
    createdAt: string;
    user: {
      id: number;
      username: string;
      avatarUrl?: string;
    };
  };
}

export interface MemberJoinedPayload {
  projectId: number;
  member: {
    id: number;
    username: string;
    email: string;
    avatarUrl?: string;
  };
}

export interface ListCreatedPayload {
  projectId: number;
  list: {
    id: number;
    name: string;
    status: string;
    order: number;
  };
}

export interface PresencePayload {
  projectId: number;
  user: BoardUser;
}

export interface BoardUsersPayload {
  projectId: number;
  users: BoardUser[];
}

export interface AttachmentPayload {
  id: number;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface AttachmentsUpdatedPayload {
  projectId: number;
  cardId: number;
  attachments: AttachmentPayload[];
}
