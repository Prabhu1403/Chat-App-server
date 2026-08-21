import { Socket, Server } from "socket.io";
import Message from "../models/message";
import { onlineUsers } from "./index";
import { Conversation, ConversationMembers } from "../models";
import { sequelize } from "../config/db";

import { QueryTypes } from "sequelize";

export function registerMessageHandlers(io: Server, socket: Socket) {
  // Send a private message to another user
  socket.on("send_message", async (data: any, callback?: any) => {
    try {
      console.log("Message Data:", data);
      const receiverSocketId = onlineUsers.get(data.receiverId);
      const isReceiverOnline = !!receiverSocketId;

      // Step 1: Find existing private conversation    
      const sharedConversations: any = await sequelize.query(`
          SELECT cm.conversation_id 
          FROM conversation_members cm
          INNER JOIN conversations c ON cm.conversation_id = c.id
          WHERE cm.user_id IN (:sender, :receiver) AND c.type = 'private'
          GROUP BY cm.conversation_id 
          HAVING COUNT(DISTINCT cm.user_id) = 2
      `, {
          replacements: { sender: data.senderId, receiver: data.receiverId },
          type: QueryTypes.SELECT
      });
      
      let conversation: any = null;
      if (sharedConversations && sharedConversations.length > 0) {
          conversation = await Conversation.findByPk(sharedConversations[0].conversation_id);
      }
      
      console.log("conversationId", conversation?.id);
      
      // Step 2: Create conversation if it doesn't exist    
      if (!conversation) {
          conversation = await Conversation.create({
              type: "private",
              created_by: data.senderId
          });
       
          await ConversationMembers.bulkCreate([
              {
                  conversation_id: conversation.id,
                  user_id: data.senderId,
                  joined_at: new Date()
              },
              {
                  conversation_id: conversation.id,
                  user_id: data.receiverId,
                  joined_at: new Date()
              }
          ]);
      }
      
      // Step 3: Save message
      const savedMessage = await Message.create({
          senderId: data.senderId,
          receiverId: data.receiverId,
          message: data.message,
          status: isReceiverOnline ? "delivered" : "sent",
          isRead: false,
          is_forward: data.is_forward || false,
          forwarded_from: data.forwarded_from || null,
          conversation_id: conversation.id
      });
      
      const messageToEmit = savedMessage.toJSON();
      // Echo back the exact createdAt timestamp from the client so that the
      // frontend's optimistic update logic can match it and avoid duplicates
      if (data.createdAt) {
          messageToEmit.createdAt = data.createdAt;
      }

      if (isReceiverOnline) {
        io.to(receiverSocketId).emit("receive_message", messageToEmit);
      }

      // Also emit back to the sender's own socket so they see the message
      // in real-time (important for forwarded messages and multi-tab use)
      const senderSocketId = onlineUsers.get(String(data.senderId));
      if (senderSocketId) {
        io.to(senderSocketId).emit("receive_message", messageToEmit);
      }

      // Send saved message back to sender via acknowledgment callback
      if (typeof callback === "function") {
        console.log("Callback: ", messageToEmit);
        callback(messageToEmit);
      }
    } catch (error) {
      console.error("Error in send_message:", error);
    }
  });

  // Delete a message for everyone - notify the receiver in real-time
  socket.on("delete_message_for_everyone", async (data: { messageId: number; senderId: string; receiverId: string }) => {
    try {
      const { messageId, senderId, receiverId } = data;
      console.log("Message ID to delete:", messageId);

      const msg = await Message.findByPk(messageId);
      if (!msg) return;

      // Only sender can delete for everyone
      if (msg.senderId !== String(senderId)) return;

      await msg.update({ is_delete_for_everyone: true });

      // Notify receiver if online
      const receiverSocketId = onlineUsers.get(String(receiverId));
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("message_deleted_for_everyone", { messageId });
      }

      // Also notify sender's other sessions (optional)
      const senderSocketId = onlineUsers.get(String(senderId));
      if (senderSocketId) {
        io.to(senderSocketId).emit("message_deleted_for_everyone", { messageId });
      }
    } catch (error) {
      console.error("Error in delete_message_for_everyone:", error);
    }
  });

  // Undo delete a message for everyone - notify the receiver in real-time
  socket.on("undo_delete_message_for_everyone", async (data: { messageId: number; senderId: string; receiverId: string }) => {
    try {
      const { messageId, senderId, receiverId } = data;

      const msg = await Message.findByPk(messageId);
      if (!msg) return;

      // Only sender can undo delete for everyone
      if (msg.senderId !== String(senderId)) return;

      await msg.update({ is_delete_for_everyone: false });
      await msg.save()

      // Notify receiver if online
      const receiverSocketId = onlineUsers.get(String(receiverId));
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("message_undo_deleted_for_everyone", { messageId });
      }

      // Also notify sender's other sessions (optional)
      const senderSocketId = onlineUsers.get(String(senderId));
      if (senderSocketId) {
        io.to(senderSocketId).emit("message_undo_deleted_for_everyone", { messageId });
      }
    } catch (error) {
      console.error("Error in undo_delete_message_for_everyone:", error);
    }
  });

  //undo delete for me - notify the receiver in real-time
  socket.on("undo_delete_for_me", async (data: any) => {
    const { messageId, userId } = data
    if (!messageId || !userId) {
      return "messageId and userId are required"
    }
    try {
      const msg = await Message.findByPk(messageId);
      const filterdmsg = msg?.delete_for_me_ids.filter((id) => id !== userId)
      await msg?.update({ delete_for_me_ids: filterdmsg })
      const userSocketId = onlineUsers.get(String(userId))
      console.log("userSocketID>>", userSocketId);

      if (userSocketId) {
        io.to(userSocketId).emit("message_undo_deleted_for_me", { userId, messageId })
      }
    }
    catch (error) {
      console.error("Error in undo_delete_for_me:", error);
    }
  })

  // Mark messages as read and notify the original sender
  socket.on("mark_message_read", async (data: any, callback?: any) => {
    const { senderId, receiverId } = data;
    if (!senderId || !receiverId) {
      return callback?.({
        success: false,
        message: "sender and receiver are required",
      });
    }
    try {
      const messages = await Message.findAll({
        where: {
          senderId: senderId,
          receiverId: receiverId,
          isRead: false,
        },
      });

      if (messages.length === 0) {
        return callback?.({
          success: false,
          message: "No messages to mark as seen",
        });
      }

      await Message.update(
        { isRead: true, status: "seen" },
        {
          where: {
            senderId: senderId,
            receiverId: receiverId,
            isRead: false,
          },
        }
      );

      const updatedMessage = messages.map((msg) => ({
        ...msg.toJSON(),
        isRead: true,
        status: "seen",
      }));

      // Notify the original sender that their messages have been read
      const senderSocketId = onlineUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messages_read", {
          receiverId: receiverId,
        });
      }

      return callback?.({
        success: true,
        data: updatedMessage,
        message: "Messages marked as seen",
      });
    } catch (err) {
      console.error("Error in mark_message_read:", err);
      return callback?.({
        success: false,
        message: "Failed to mark messages as seen",
      });
    }
  });

  socket.on("edit_message", async (data: any, callback?: any) => {
    const { messageId, message, userId, receiverId } = data
    if (!messageId || !message || !userId) {
      return callback?.({
        success: false,
        message: "messageId and message and userId are required",
      });
    }
    try {
      const msg = await Message.findByPk(messageId);
      if (!msg) {
        return callback?.({
          success: false,
          message: "message not found",
        });
      }
      await msg.update({ message: message, isRead: true })
      await msg.save();

      // Emit real-time update to the receiver if they are online
      if (receiverId) {
        const receiverSocketId = onlineUsers.get(String(receiverId));
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("message_edited", {
            messageId: msg.id,
            message: msg.message,
          });
        }
      }

      return callback?.({
        success: true,
        data: msg,
        message: "message edited successfully",
      });
    }
    catch (error) {
      console.error("Error in edit_message:", error);
      return callback?.({
        success: false,
        message: "Failed to edit message",
      });
    }
  });

  // Delete message permanently from db
  socket.on("delete_message_permanently", async (data: { messageId: number; userId: string }) => {
    try {
      const { messageId, userId } = data;
      const msg = await Message.findByPk(messageId);
      if (!msg) return;

      // Only sender or receiver can delete permanently
      if (msg.senderId !== String(userId) && msg.receiverId !== String(userId)) return;

      await msg.destroy();

      // Optionally notify other user if you want it removed from their UI
      // but if it's already deleted for everyone, it might not matter much
      const receiverSocketId = onlineUsers.get(msg.receiverId === String(userId) ? msg.senderId : msg.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("message_deleted_permanently", { messageId });
      }

    } catch (error) {
      console.error("Error in delete_message_permanently:", error);
    }
  });
}
