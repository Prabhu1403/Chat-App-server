import { Request, Response } from "express";
import { Op } from "sequelize";
import Message from "../models/message";
import Users from "../models/user";
import { Conversation, ConversationMembers } from "../models";

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { senderId, receiverId, message, timestamp, status } = req.body;
        console.log("Incoming sendMessage request:", { senderId, receiverId, message });

        if (!senderId || !receiverId || !message) {
            console.warn("sendMessage: Missing required fields", { senderId, receiverId, message });
            return res.status(400).json({ error: "Missing required fields", received: { senderId, receiverId, message } });
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            message,
            timestamp,
            status: status || "sent",
            isRead: false
        });

        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Error saving message:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getMessages = async (req: Request, res: Response) => {
    try {
        const { senderId, receiverId } = req.query;
        console.log("Incoming getMessages request:", { senderId, receiverId });

        if (!senderId || !receiverId) {
            console.warn("getMessages: Sender ID or Receiver ID missing", { senderId, receiverId });
            return res.status(400).json({ error: "Sender ID and Receiver ID are required", received: { senderId, receiverId } });
        }

        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { senderId: senderId, receiverId: receiverId },
                    { senderId: receiverId, receiverId: senderId }
                ]
            },
            order: [['createdAt', 'ASC']]
        });

        // Send all messages to the frontend. The frontend handles showing "You deleted this message"
        res.status(200).json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getConversations = async (req: Request, res: Response) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        // Fetch all messages involving the user
        const messages = await Message.findAll({
            where: {
                [Op.or]: [{ senderId: userId }, { receiverId: userId }]
            },
            order: [['createdAt', 'DESC']],
        });

        // filter out messages deleted for this user
        const visibleMessages = messages.filter(msg => {
            const deletedForMe = (msg.delete_for_me_ids as any) || [];
            return !deletedForMe.includes(String(userId));
        });

        // Group by the "other" user and keep the latest message
        const lastMessages = new Map<string, Message>();
        const unreadCounts = new Map<string, number>();

        for (const msg of visibleMessages) {
            const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
            if (!lastMessages.has(otherUserId)) {
                lastMessages.set(otherUserId, msg);
            }
            if (msg.receiverId === userId && msg.isRead === false) {
                unreadCounts.set(otherUserId, (unreadCounts.get(otherUserId) || 0) + 1);
            }
        }

        // Fetch user details for each "other" user
        const otherUserIds = Array.from(lastMessages.keys());
        const users = await Users.findAll({
            where: { userId: otherUserIds },
            attributes: ['userId', 'name', 'profilePicture', 'phone']
        });

        // Fetch conversation members for the user to get is_archived status
        const conversationMembers = await ConversationMembers.findAll({
            where: { user_id: String(userId) },
            attributes: ['conversation_id', 'is_archived']
        });
        const archivedConversations = new Set(
            conversationMembers.filter(cm => cm.is_archived).map(cm => cm.conversation_id)
        );

        const result = users.map(user => {
            const lastMsg = user.userId ? lastMessages.get(user.userId) : undefined;
            const unread = user.userId ? (unreadCounts.get(user.userId) || 0) : 0;
            console.log("unread", unread);

            let lastMessageText = lastMsg ? lastMsg.message : "";
            if (lastMsg?.is_delete_for_everyone) {
                lastMessageText = "This message was deleted";
            }

            const is_archived = lastMsg?.conversation_id ? archivedConversations.has(lastMsg.conversation_id) : false;

            return {
                id: user.userId || "",
                name: user.name,
                profilePicture: user.profilePicture,
                phone: user.phone,
                lastMessage: lastMessageText,
                lastMessageTime: lastMsg ? new Date((lastMsg as any).createdAt || lastMsg.timestamp).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true
                }) : "",
                status: lastMsg ? lastMsg.status : "sent",
                unread: unread,
                is_archived: is_archived
            };
        });

        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const markMessagesAsRead = async (req: Request, res: Response) => {
    try {
        const { senderId, receiverId } = req.body;

        if (!senderId || !receiverId) {
            return res.status(400).json({ error: "Sender ID and Receiver ID are required" });
        }

        await Message.update(
            { status: "seen", isRead: true },
            {
                where: {
                    senderId: senderId,
                    receiverId: receiverId,
                    isRead: false
                }
            }
        );

        res.status(200).json({ message: "Messages marked as read" });
    } catch (error) {
        console.error("Error marking messages as read:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteMessageForMe = async (req: Request, res: Response) => {
    try {
        const { messageId, userId } = req.body;

        if (!messageId || !userId) {
            return res.status(400).json({ error: "messageId and userId are required" });
        }

        const msg = await Message.findByPk(messageId);
        if (!msg) {
            return res.status(404).json({ error: "Message not found" });
        }

        const currentIds: string[] = [...((msg.delete_for_me_ids as any) || [])];
        if (!currentIds.includes(String(userId))) {
            currentIds.push(String(userId));
        }

        await msg.update({ delete_for_me_ids: currentIds });
        await msg.save()

        console.log("Message deleted for you, ids now:", currentIds);


        res.status(200).json({ message: "Message deleted for you" });
    } catch (error) {
        console.error("Error deleting message for me:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteMessageForEveryone = async (req: Request, res: Response) => {
    try {
        const { messageId, userId } = req.body;

        if (!messageId || !userId) {
            return res.status(400).json({ error: "messageId and userId are required" });
        }

        const msg = await Message.findByPk(messageId);
        if (!msg) {
            return res.status(404).json({ error: "Message not found" });
        }

        if (msg.senderId !== String(userId)) {
            return res.status(403).json({ error: "Only the sender can delete a message for everyone" });
        }

        await msg.update({ is_delete_for_everyone: true });

        res.status(200).json({ message: "Message deleted for everyone" });
    } catch (error) {
        console.error("Error deleting message for everyone:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteConversation = async (req: Request, res: Response) => {
    try {
        const { userId, otherUserId } = req.body;

        if (!userId || !otherUserId) {
            return res.status(400).json({ error: "userId and otherUserId are required" });
        }

        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { senderId: userId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: userId }
                ]
            }
        });

        for (const msg of messages) {
            const currentIds: string[] = [...((msg.delete_for_me_ids as any) || [])];
            if (!currentIds.includes(String(userId))) {
                currentIds.push(String(userId));
                await msg.update({ delete_for_me_ids: currentIds });
            }
        }

        res.status(200).json({ message: "Conversation deleted" });
    } catch (error) {
        console.error("Error deleting conversation:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const archiveConversation = async (req: Request, res: Response) => {
    try {
        const { userId, otherUserId } = req.body;

        if (!userId || !otherUserId) {
            return res.status(400).json({ error: "userId and otherUserId are required" });
        }

        // Find a message between them that has conversation_id
        const msg = await Message.findOne({
            where: {
                [Op.or]: [
                    { senderId: userId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: userId }
                ],
                conversation_id: { [Op.ne]: null }
            }
        });

        if (!msg || !msg.conversation_id) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        // Update conversation members
        await ConversationMembers.update(
            { is_archived: true },
            {
                where: {
                    conversation_id: msg.conversation_id,
                    user_id: String(userId)
                }
            }
        );

        res.status(200).json({ message: "Conversation archived" });
    } catch (error) {
        console.error("Error archiving conversation:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
