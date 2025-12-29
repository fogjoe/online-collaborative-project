import { Injectable } from '@nestjs/common';
import { BoardGateway } from './board.gateway';
import {
  WebSocketEvents,
  CardCreatedPayload,
  CardUpdatedPayload,
  CardMovedPayload,
  CardDeletedPayload,
  CommentAddedPayload,
  MemberJoinedPayload,
  ListCreatedPayload,
} from './websocket.types';

@Injectable()
export class WebsocketService {
  constructor(private readonly boardGateway: BoardGateway) {}

  // Emit card created event to project room
  emitCardCreated(payload: CardCreatedPayload) {
    const room = this.boardGateway.getProjectRoom(payload.projectId);
    this.boardGateway.server
      .to(room)
      .emit(WebSocketEvents.CARD_CREATED, payload);
  }

  // Emit card updated event to project room
  emitCardUpdated(payload: CardUpdatedPayload) {
    const room = this.boardGateway.getProjectRoom(payload.projectId);
    this.boardGateway.server
      .to(room)
      .emit(WebSocketEvents.CARD_UPDATED, payload);
  }

  // Emit card moved event to project room
  emitCardMoved(payload: CardMovedPayload) {
    const room = this.boardGateway.getProjectRoom(payload.projectId);
    this.boardGateway.server.to(room).emit(WebSocketEvents.CARD_MOVED, payload);
  }

  // Emit card deleted event to project room
  emitCardDeleted(payload: CardDeletedPayload) {
    const room = this.boardGateway.getProjectRoom(payload.projectId);
    this.boardGateway.server
      .to(room)
      .emit(WebSocketEvents.CARD_DELETED, payload);
  }

  // Emit comment added event to project room
  emitCommentAdded(payload: CommentAddedPayload) {
    const room = this.boardGateway.getProjectRoom(payload.projectId);
    this.boardGateway.server
      .to(room)
      .emit(WebSocketEvents.COMMENT_ADDED, payload);
  }

  // Emit member joined event to project room
  emitMemberJoined(payload: MemberJoinedPayload) {
    const room = this.boardGateway.getProjectRoom(payload.projectId);
    this.boardGateway.server
      .to(room)
      .emit(WebSocketEvents.MEMBER_JOINED, payload);
  }

  // Emit list created event to project room
  emitListCreated(payload: ListCreatedPayload) {
    const room = this.boardGateway.getProjectRoom(payload.projectId);
    this.boardGateway.server
      .to(room)
      .emit(WebSocketEvents.LIST_CREATED, payload);
  }

  // Get current users viewing a project board
  getProjectViewers(projectId: number) {
    return this.boardGateway.getProjectUsers(projectId);
  }
}
