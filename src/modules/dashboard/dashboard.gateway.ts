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

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/dashboard',
})
export class DashboardGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(DashboardGateway.name);

  @WebSocketServer()
  server: Server;

  private guardianSockets: Map<string, Socket> = new Map();

  handleConnection(client: Socket) {
    this.logger.log(`Dashboard client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    for (const [guardianId, socket] of this.guardianSockets) {
      if (socket.id === client.id) {
        this.guardianSockets.delete(guardianId);
        break;
      }
    }
  }

  @SubscribeMessage('auth')
  handleAuth(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { guardianId: string },
  ) {
    this.guardianSockets.set(data.guardianId, client);
    this.logger.log(`Guardian ${data.guardianId} connected to dashboard`);
  }

  notifyGuardians(wardId: string, event: string, data: any) {
    this.server?.emit(`ward:${wardId}:${event}`, data);
  }

  notifyGuardian(guardianId: string, event: string, data: any) {
    const socket = this.guardianSockets.get(guardianId);
    if (socket) {
      socket.emit(event, data);
    }
  }
}
