import { Socket, Server } from "socket.io";
import { onlineUsers } from "./index";

export function registerTypingHandlers(io: Server, socket: Socket) {
  // Broadcast typing indicator
  socket.on("typing", (data: any) => {
    if (data.groupId) {
      socket.to(`group-${data.groupId}`).emit("typing", data);
    } else if (data.receiverId) {
      const receiverSocketId = onlineUsers.get(data.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing", data);
      }
    }
  });

  // Broadcast stop typing indicator
  socket.on("stop_typing", (data: any) => {
    if (data.groupId) {
      socket.to(`group-${data.groupId}`).emit("stop_typing", data);
    } else if (data.receiverId) {
      const receiverSocketId = onlineUsers.get(data.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("stop_typing", data);
      }
    }
  });
}
