import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { getServiceRoom, SOCKET_EVENTS } from "./socket.events";
import { subscribeRealtimeEvents } from "./realtime-bus";

let io: Server | null = null;

export const initSocketServer = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
    },
  });

  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on(SOCKET_EVENTS.JOIN_SERVICE, (serviceId: string) => {
      if (!serviceId) return;
      socket.join(getServiceRoom(serviceId));
      socket.emit("service:joined", { serviceId });
    });

    socket.on(SOCKET_EVENTS.LEAVE_SERVICE, (serviceId: string) => {
      if (!serviceId) return;
      socket.leave(getServiceRoom(serviceId));
      socket.emit("service:left", { serviceId });
    });

    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  subscribeRealtimeEvents(({ serviceId, event, payload }) => {
    io?.to(getServiceRoom(serviceId)).emit(event, payload);
  }).catch((error) => {
    console.error("Realtime subscriber failed:", error);
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket server is not initialized");
  return io;
};

export const emitToService = (
  serviceId: string,
  event: string,
  payload: unknown
) => {
  getIO().to(getServiceRoom(serviceId)).emit(event, payload);
};
