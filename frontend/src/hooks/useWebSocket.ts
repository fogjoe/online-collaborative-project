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
  BoardUsersPayload,
  AttachmentsUpdatedPayload
} from '@/types/websocket'

const SOCKET_URL = 'http://localhost:7001/board'

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
  onAttachmentsUpdated?: (payload: AttachmentsUpdatedPayload) => void
}

export const useWebSocket = (options: UseWebSocketOptions) => {
  const { projectId } = options

  // Use refs for callbacks to avoid reconnection on callback changes
  const callbacksRef = useRef(options)

  // Update callbacks ref in useEffect to avoid accessing ref during render
  useEffect(() => {
    callbacksRef.current = options
  })

  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [boardUsers, setBoardUsers] = useState<BoardUser[]>([])
  const currentProjectRef = useRef<number | null>(null)

  // Stable connect function that doesn't change
  const connect = useCallback(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      console.warn('No auth token found, cannot connect to WebSocket')
      return
    }

    // Don't reconnect if already connected
    if (socketRef.current?.connected) {
      return
    }

    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect()
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    })

    socket.on('connect', () => {
      console.log('WebSocket connected')
      setIsConnected(true)

      // Join the project room if we have a projectId
      const pid = currentProjectRef.current
      if (pid) {
        socket.emit(WebSocketEvents.JOIN_PROJECT, { projectId: pid }, (response: { success: boolean; users?: BoardUser[] }) => {
          if (response.success && response.users) {
            setBoardUsers(response.users)
          }
        })
      }
    })

    socket.on('disconnect', reason => {
      console.log('WebSocket disconnected:', reason)
      setIsConnected(false)
    })

    socket.on('connect_error', error => {
      console.error('WebSocket connection error:', error.message)
    })

    socket.on('error', (error: { message: string }) => {
      console.error('WebSocket error:', error.message)
    })

    // Card events - use refs to get latest callbacks
    socket.on(WebSocketEvents.CARD_CREATED, (payload: CardCreatedPayload) => {
      const pid = currentProjectRef.current
      if (payload.projectId === pid) {
        callbacksRef.current.onCardCreated?.(payload)
      }
    })

    socket.on(WebSocketEvents.CARD_UPDATED, (payload: CardUpdatedPayload) => {
      const pid = currentProjectRef.current
      if (payload.projectId === pid) {
        callbacksRef.current.onCardUpdated?.(payload)
      }
    })

    socket.on(WebSocketEvents.CARD_MOVED, (payload: CardMovedPayload) => {
      const pid = currentProjectRef.current
      if (payload.projectId === pid) {
        callbacksRef.current.onCardMoved?.(payload)
      }
    })

    socket.on(WebSocketEvents.CARD_DELETED, (payload: CardDeletedPayload) => {
      const pid = currentProjectRef.current
      if (payload.projectId === pid) {
        callbacksRef.current.onCardDeleted?.(payload)
      }
    })

    // Comment events
    socket.on(WebSocketEvents.COMMENT_ADDED, (payload: CommentAddedPayload) => {
      const pid = currentProjectRef.current
      if (payload.projectId === pid) {
        callbacksRef.current.onCommentAdded?.(payload)
      }
    })

    // Member events
    socket.on(WebSocketEvents.MEMBER_JOINED, (payload: MemberJoinedPayload) => {
      const pid = currentProjectRef.current
      if (payload.projectId === pid) {
        callbacksRef.current.onMemberJoined?.(payload)
      }
    })

    // List events
    socket.on(WebSocketEvents.LIST_CREATED, (payload: ListCreatedPayload) => {
      const pid = currentProjectRef.current
      if (payload.projectId === pid) {
        callbacksRef.current.onListCreated?.(payload)
      }
    })

    // Presence events
    socket.on(WebSocketEvents.USER_JOINED_BOARD, (payload: PresencePayload) => {
      const pid = currentProjectRef.current
      if (payload.projectId === pid) {
        setBoardUsers(prev => {
          if (prev.some(u => u.userId === payload.user.userId)) {
            return prev
          }
          return [...prev, payload.user]
        })
        callbacksRef.current.onUserJoined?.(payload)
      }
    })

    socket.on(WebSocketEvents.USER_LEFT_BOARD, (payload: PresencePayload) => {
      const pid = currentProjectRef.current
      if (payload.projectId === pid) {
        setBoardUsers(prev => prev.filter(u => u.userId !== payload.user.userId))
        callbacksRef.current.onUserLeft?.(payload)
      }
    })

    socket.on(WebSocketEvents.BOARD_USERS, (payload: BoardUsersPayload) => {
      const pid = currentProjectRef.current
      if (payload.projectId === pid) {
        setBoardUsers(payload.users)
        callbacksRef.current.onBoardUsers?.(payload)
      }
    })

    socket.on(WebSocketEvents.ATTACHMENTS_UPDATED, (payload: AttachmentsUpdatedPayload) => {
      const pid = currentProjectRef.current
      if (payload.projectId === pid) {
        callbacksRef.current.onAttachmentsUpdated?.(payload)
      }
    })

    socketRef.current = socket
  }, []) // No dependencies - only runs once

  // Disconnect function
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      const pid = currentProjectRef.current
      if (pid) {
        socketRef.current.emit(WebSocketEvents.LEAVE_PROJECT, { projectId: pid })
      }
      socketRef.current.disconnect()
      socketRef.current = null
      setIsConnected(false)
      setBoardUsers([])
    }
  }, [])

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Handle project changes - join new room when projectId changes
  useEffect(() => {
    const previousProjectId = currentProjectRef.current
    currentProjectRef.current = projectId

    if (socketRef.current?.connected && projectId) {
      // Leave previous project room if different
      if (previousProjectId && previousProjectId !== projectId) {
        socketRef.current.emit(WebSocketEvents.LEAVE_PROJECT, { projectId: previousProjectId })
      }

      // Join new project room
      socketRef.current.emit(WebSocketEvents.JOIN_PROJECT, { projectId }, (response: { success: boolean; users?: BoardUser[] }) => {
        if (response.success) {
          setBoardUsers(response.users || [])
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
