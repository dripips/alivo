import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import {
  ChannelAdapter,
  IncomingMessage,
  OutgoingMessage,
} from '../channel.interface';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class WebGateway
  implements ChannelAdapter, OnGatewayConnection, OnGatewayDisconnect
{
  readonly type = 'WEB' as const;
  private readonly logger = new Logger(WebGateway.name);
  private clients: Map<string, Socket> = new Map();
  private socketToUser: Map<string, string> = new Map();

  private messageHandler?: (msg: IncomingMessage) => Promise<void>;
  private callbackHandler?: (msg: IncomingMessage) => Promise<void>;

  @WebSocketServer()
  server: Server;

  onMessage(handler: (msg: IncomingMessage) => Promise<void>) {
    this.messageHandler = handler;
  }

  onCallback(handler: (msg: IncomingMessage) => Promise<void>) {
    this.callbackHandler = handler;
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketToUser.get(client.id);
    if (userId) {
      this.clients.delete(userId);
      this.socketToUser.delete(client.id);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('auth')
  handleAuth(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    this.clients.set(data.userId, client);
    this.socketToUser.set(client.id, data.userId);
    this.logger.log(`User ${data.userId} authenticated via WebSocket`);
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { text: string },
  ) {
    const userId = this.socketToUser.get(client.id);
    if (!userId || !this.messageHandler) return;

    await this.messageHandler({
      channelType: 'WEB',
      externalUserId: userId,
      text: data.text,
    });
  }

  @SubscribeMessage('callback')
  async handleCallback(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callbackData: string },
  ) {
    const userId = this.socketToUser.get(client.id);
    if (!userId || !this.callbackHandler) return;

    await this.callbackHandler({
      channelType: 'WEB',
      externalUserId: userId,
      text: '',
      callbackData: data.callbackData,
    });
  }

  async sendMessage(msg: OutgoingMessage) {
    const client = this.clients.get(msg.externalUserId);
    if (!client) return;
    client.emit('message', { text: msg.text, buttons: msg.buttons });
  }

  async sendAlert(externalUserId: string, text: string) {
    const client = this.clients.get(externalUserId);
    if (client) {
      client.emit('alert', { text });
    }
  }

  emitToDashboard(event: string, data: any) {
    this.server?.emit(event, data);
  }

  async start() {}
  async stop() {}
}
