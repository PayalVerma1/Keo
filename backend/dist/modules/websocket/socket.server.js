import { Server } from "socket.io";
import { getServiceRoom, SOCKET_EVENTS, } from "./socket.events.js";
let io = null;
export const initSocketServer = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "*",
            methods: ["GET", "POST"],
        },
    });
    io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
        console.log(`Socket connected: ${socket.id}`);
        socket.on(SOCKET_EVENTS.JOIN_SERVICE, (serviceId) => {
            if (!serviceId) {
                return;
            }
            socket.join(getServiceRoom(serviceId)); //user joins the room
            socket.emit("service:joined", { serviceId }); //
        });
        socket.on(SOCKET_EVENTS.LEAVE_SERVICE, (serviceId) => {
            if (!serviceId) {
                return;
            }
            socket.leave(getServiceRoom(serviceId));
            socket.emit("service:left", { serviceId });
        });
        socket.on(SOCKET_EVENTS.DISCONNECT, () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
    return io;
};
export const getIO = () => {
    if (!io) {
        throw new Error("Socket server is not initialized");
    }
    return io;
};
export const emitToService = (serviceId, event, payload) => {
    getIO()
        .to(getServiceRoom(serviceId))
        .emit(event, payload);
};
