import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  vendorId?: number;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/',
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WebsocketGateway.name);
  private connectedClients: Map<string, { vendorId: number; userId: number }> = new Map();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      client.userId = payload.sub;
      client.vendorId = payload.vendorId;
      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch {
      this.logger.warn(`Client ${client.id} rejected: invalid token`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe_vendor')
  handleSubscribeVendor(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { vendorId: number; userId: number },
  ) {
    const vendorId = client.vendorId || data.vendorId;
    const userId = client.userId || data.userId;
    if (!vendorId) return { event: 'error', data: { message: 'No vendor context' } };
    const room = `vendor_${vendorId}`;
    client.join(room);
    this.connectedClients.set(client.id, { vendorId, userId });
    this.logger.log(`Client ${client.id} joined vendor room: ${room}`);
    return { event: 'subscribed', data: { room } };
  }

  @SubscribeMessage('join_chat')
  handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { contactId: number },
  ) {
    const room = `chat_${data.contactId}`;
    client.join(room);
    return { event: 'joined_chat', data: { room } };
  }

  @SubscribeMessage('leave_chat')
  handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { contactId: number },
  ) {
    const room = `chat_${data.contactId}`;
    client.leave(room);
    return { event: 'left_chat', data: { room } };
  }

  @SubscribeMessage('send_message')
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { contactId: number; message: string; type: string },
  ) {
    // Message sending is handled by WhatsApp service, this just acknowledges
    return { event: 'message_queued', data: { contactId: data.contactId } };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { contactId: number; isTyping: boolean },
  ) {
    const room = `chat_${data.contactId}`;
    client.to(room).emit('typing_indicator', {
      userId: this.connectedClients.get(client.id)?.userId,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('mark_read')
  handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { contactId: number; messageIds: string[] },
  ) {
    return { event: 'marked_read', data };
  }

  // Server-side emit helpers
  emitNewMessage(vendorId: number, contactId: number, message: Record<string, unknown>) {
    this.server.to(`vendor_${vendorId}`).emit('new_message', message);
    this.server.to(`chat_${contactId}`).emit('new_message', message);
  }

  emitMessageStatus(vendorId: number, contactId: number, status: Record<string, unknown>) {
    this.server.to(`vendor_${vendorId}`).emit('message_status', status);
    this.server.to(`chat_${contactId}`).emit('message_status', status);
  }

  emitNotification(vendorId: number, notification: Record<string, unknown>) {
    this.server.to(`vendor_${vendorId}`).emit('notification', notification);
  }

  emitCampaignProgress(vendorId: number, progress: Record<string, unknown>) {
    this.server.to(`vendor_${vendorId}`).emit('campaign_progress', progress);
  }

  emitNewContact(vendorId: number, contact: Record<string, unknown>) {
    this.server.to(`vendor_${vendorId}`).emit('new_contact', contact);
  }

  emitWebhookEvent(vendorId: number, event: Record<string, unknown>) {
    this.server.to(`vendor_${vendorId}`).emit('webhook_event', event);
  }

  emitChatAssigned(vendorId: number, data: Record<string, unknown>) {
    this.server.to(`vendor_${vendorId}`).emit('chat_assigned', data);
  }
}
