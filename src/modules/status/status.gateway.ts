import { Logger, OnModuleInit } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { RedisService } from '../redis/redis.service';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/status' })
export class StatusGateway implements OnModuleInit {
  private readonly logger = new Logger(StatusGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly redis: RedisService) {}

  onModuleInit() {
    void this.redis.sub.subscribe('incident.created', 'incident.resolved');
    this.redis.sub.on('message', (channel: string, message: string) => {
      this.logger.log(`Broadcast on ${channel}`);
      this.server.emit('status_update', { channel, data: JSON.parse(message) });
    });
  }

  broadcastStatusUpdate(payload: Record<string, unknown>): void {
    this.server.emit('status_update', payload);
  }
}
