import { useEffect, useRef, useCallback, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import {
  WebSocketEvents,
  BoardUser,
  CardCreatedPayload,
  CardUpdatedPayload,
  CardMovedPayload,
  CardDeletedPayload,
  CommentAddedPayload,
  MemberJoinedPayload,
  ListCreatedPayload,
  PresencePayload,
  BoardUsersPayload
} from '@/types/websocket'

const SOCKET_URL = 'http://localhost:7000/board'

interface UseWebSocketOptions {
  projectId: number
  onCardCreated?: (payload: CardCreatedPayload) => void
  onCardUpdated?: (payload: CardUpdatedPayload) => void
  onCardMoved?: (payload: CardMovedPayload) => void
  onCardDeleted?: (payload: CardDeletedPayload) => void
  onCommentAdded?: (payload: CommentAddedPayload) => void
  onMemberJoined?: (payload: MemberJoinedPayload) => void
  onListCreated?: (payload: ListCreatedPayload) => void
  onUserJoined?: (payload: PresencePayload) => void
  onUserLeft?: (payload: PresencePayload) => void
  onBoardUsers?: (payload: BoardUsersPayload) => void
}

export const useWebSocket = (options: UseWebSocketOptions) => {
  const {
    projectId,
    onCardCreated,
    onCardUpdated,
    onCardMoved,
    onCardDeleted,
    onCommentAdded,
    onMemberJoined,
    onListCreated,
    onUserJoined,
    onUserLeft,
    onBoardUsers
  } = options

  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [boardUsers, setBoardUsers] = useState<BoardUser[]>([])

  // Connect to WebSocket server
  const connect = useCallback(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      console.warn('No auth token found, cannot connect to WebSocket')
      return
    }

    if (socketRef.current?.connected) {
      return
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    socket.on('connect', () => {
      console.log('WebSocket connected')
      setIsConnected(true)

      // Join the project room
      socket.emit(WebSocketEvents.JOIN_PROJECT, { projectId }, (response: { success: boolean; users?: BoardUser[] }) => {
        if (response.success && response.users) {
          setBoardUsers(response.users)
        }
      })
    })

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
    })

    socket.on('error', (error: { message: string }) => {
      console.error('WebSocket error:', error.message)
    })

    // Card events
    socket.on(WebSocketEvents.CARD_CREATED, (payload: CardCreatedPayload) => {
      if (payload.projectId === projectId) {
        onCardCreated?.(payload)
      }
    })

    socket.on(WebSocketEvents.CARD_UPDATED, (payload: CardUpdatedPayload) => {
      if (payload.projectId === projectId) {
        onCardUpdated?.(payload)
      }
    })

    socket.on(WebSocketEvents.CARD_MOVED, (payload: CardMovedPayload) => {
      if (payload.projectId === projectId) {
        onCardMoved?.(payload)
      }
    })

    socket.on(WebSocketEvents.CARD_DELETED, (payload: CardDeletedPayload) => {
      if (payload.projectId === projectId) {
        onCardDeleted?.(payload)
      }
    })

    // Comment events
    socket.on(WebSocketEvents.COMMENT_ADDED, (payload: CommentAddedPayload) => {
      if (payload.projectId === projectId) {
        onCommentAdded?.(payload)
      }
    })

    // Member events
    socket.on(WebSocketEvents.MEMBER_JOINED, (payload: MemberJoinedPayload) => {
      if (payload.projectId === projectId) {
        onMemberJoined?.(payload)
      }
    })

    // List events
    socket.on(WebSocketEvents.LIST_CREATED, (payload: ListCreatedPayload) => {
      if (payload.projectId === projectId) {
        onListCreated?.(payload)
      }
    })

    // Presence events
    socket.on(WebSocketEvents.USER_JOINED_BOARD, (payload: PresencePayload) => {
      if (payload.projectId === projectId) {
        setBoardUsers(prev => {
          // Avoid duplicates
          if (prev.some(u => u.userId === payload.user.userId)) {
            return prev
          }
          return [...prev, payload.user]
        })
        onUserJoined?.(payload)
      }
    })

    socket.on(WebSocketEvents.USER_LEFT_BOARD, (payload: PresencePayload) => {
      if (payload.projectId === projectId) {
        setBoardUsers(prev => prev.filter(u => u.userId !== payload.user.userId))
        onUserLeft?.(payload)
      }
    })

    socket.on(WebSocketEvents.BOARD_USERS, (payload: BoardUsersPayload) => {
      if (payload.projectId === projectId) {
        setBoardUsers(payload.users)
        onBoardUsers?.(payload)
      }
    })

    socketRef.current = socket
  }, [projectId, onCardCreated, onCardUpdated, onCardMoved, onCardDeleted, onCommentAdded, onMemberJoined, onListCreated, onUserJoined, onUserLeft, onBoardUsers])

  // Disconnect from WebSocket server
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      // Leave project room before disconnecting
      socketRef.current.emit(WebSocketEvents.LEAVE_PROJECT, { projectId })
      socketRef.current.disconnect()
      socketRef.current = null
      setIsConnected(false)
      setBoardUsers([])
    }
  }, [projectId])

  // Connect on mount and disconnect on unmount
  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Reconnect when projectId changes
  useEffect(() => {
    if (socketRef.current?.connected) {
      // Leave old room and join new room
      socketRef.current.emit(WebSocketEvents.JOIN_PROJECT, { projectId }, (response: { success: boolean; users?: BoardUser[] }) => {
        if (response.success && response.users) {
          setBoardUsers(response.users)
        }
      })
    }
  }, [projectId])

  return {
    isConnected,
    boardUsers,
    connect,
    disconnect
  }
}
