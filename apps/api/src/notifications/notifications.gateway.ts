import {
  WebSocketGateway, WebSocketServer, OnGatewayConnection,
  OnGatewayDisconnect, SubscribeMessage,
} from "@nestjs/websockets"
import { Logger } from "@nestjs/common"
import { OnEvent } from "@nestjs/event-emitter"
import { JwtService } from "@nestjs/jwt"
import { ConfigService } from "@nestjs/config"
import type { Server, Socket } from "socket.io"

@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: "/realtime",
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server

  private readonly logger = new Logger(NotificationsGateway.name)
  private userSockets = new Map<string, Set<string>>()

  constructor(
    private jwt: JwtService,
    private config: ConfigService
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token ?? client.handshake.headers.authorization?.replace("Bearer ", "")
      if (!token) {
        client.disconnect()
        return
      }

      const payload = this.jwt.verify(token, {
        secret: this.config.get<string>("auth.jwtSecret"),
      }) as { sub: string }

      client.data.userId = payload.sub
      const sockets = this.userSockets.get(payload.sub) ?? new Set()
      sockets.add(client.id)
      this.userSockets.set(payload.sub, sockets)

      client.join(`user:${payload.sub}`)
      this.logger.log(`Client connected: ${client.id} (user ${payload.sub})`)
    } catch {
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId as string | undefined
    if (userId) {
      const sockets = this.userSockets.get(userId)
      sockets?.delete(client.id)
      if (sockets && sockets.size === 0) this.userSockets.delete(userId)
    }
  }

  @SubscribeMessage("ping")
  handlePing() {
    return { pong: Date.now() }
  }

  // ─── Event handlers ─────────────────────────────────────────

  @OnEvent("generation.completed")
  onGenerationCompleted(payload: { userId: string; generationId: string; result: unknown }) {
    this.server.to(`user:${payload.userId}`).emit("generation:completed", payload)
  }

  @OnEvent("generation.progress")
  onGenerationProgress(payload: { userId: string; generationId: string; progress: number }) {
    this.server.to(`user:${payload.userId}`).emit("generation:progress", payload)
  }

  @OnEvent("notification.created")
  onNotificationCreated(payload: { userId: string; notification: unknown }) {
    this.server.to(`user:${payload.userId}`).emit("notification:new", payload.notification)
  }

  /**
   * Broadcast a custom message to a specific user.
   */
  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data)
  }
}
