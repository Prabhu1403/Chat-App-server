import { Server, Socket } from "socket.io";
import { registerUserHandlers } from "./userSocket";
import { registerMessageHandlers } from "./messageSocket";
import { registerGroupHandlers } from "./groupSocket";
import { registerTypingHandlers } from "./typingSocket";

// Shared online users map: userId -> socketId
export const onlineUsers = new Map<string, string>();

export function initSockets(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log("User Connected:", socket.id);

    registerUserHandlers(io, socket);
    registerMessageHandlers(io, socket);
    registerGroupHandlers(io, socket);
    registerTypingHandlers(io, socket);
  });
}
