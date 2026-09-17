import { Socket, Server } from "socket.io";
import { onlineUsers } from "./index";
import Message from "../models/message";
import { Op } from "sequelize";
import User from "../models/user";

export function registerUserHandlers(io: Server, socket: Socket) {
  // Register user with their socket ID
  socket.on("register_user", async (userId: string) => {
    const userIdStr = String(userId);
    onlineUsers.set(userIdStr, socket.id);
    console.log(`User ${userIdStr} registered with socket ID ${socket.id}`);

    const usersOnline = await User.update(
      { isOnline: true },
      { where: { userId: userId } }
    );

    const getOnlineUser = await User.findOne({
      where:{
        userId:userId
      }
    })



    io.emit("user_online", {
      users: Array.from(onlineUsers.keys()),
      onlineUser:getOnlineUser
    });

    // Mark all "sent" messages addressed to this user as "delivered"
    try {
      const undeliveredMessages = await Message.findAll({
        where: {
          receiverId: userIdStr,
          status: { [Op.in]: ["sent"] },
        },
      });

      if (undeliveredMessages.length > 0) {
        // Bulk update to "delivered"
        await Message.update(
          { status: "delivered" },
          {
            where: {
              receiverId: userIdStr,
              status: { [Op.in]: ["sent"] },
            },
          }
        );

        // Group updated message IDs by senderId so we notify each sender once
        const senderMap = new Map<string, number[]>();
        for (const msg of undeliveredMessages) {
          const existing = senderMap.get(msg.senderId) || [];
          existing.push(msg.id!);
          senderMap.set(msg.senderId, existing);
        }

        // Emit "messages_delivered" to each sender if they are online
        for (const [senderId, messageIds] of senderMap.entries()) {
          const senderSocketId = onlineUsers.get(senderId);
          if (senderSocketId) {
            io.to(senderSocketId).emit("messages_delivered", {
              messageIds,
              receiverId: userIdStr,
            });
            console.log(
              `Notified sender ${senderId} that ${messageIds.length} message(s) were delivered to ${userIdStr}`
            );
          }
        }
      }
    } catch (error) {
      console.error("Error updating message delivery status on user online:", error);
    }
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    setTimeout(() => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          console.log(`User ${userId} disconnected and removed from online list`);
          const lastSeenTime = new Date().toLocaleString();
          User.update(
            { isOnline: false, lastSeen: lastSeenTime },

            { where: { userId: userId } }
          );
          io.emit("user_offline", {
            users: Array.from(onlineUsers.keys()),
            userId: userId,
            lastseen: lastSeenTime
          });
          break;
        }
      }
    }, 1000);
  });
}
