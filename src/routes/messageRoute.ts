import { Router } from "express";
import { sendMessage, getMessages, getConversations, markMessagesAsRead, deleteMessageForMe, deleteMessageForEveryone, deleteConversation, archiveConversation } from "../controllers/messageController";
import { verifyToken } from "../middleware/authmiddleware";

const router = Router();

// Apply auth middleware if needed
router.post("/messages", verifyToken, sendMessage);
router.get("/messages", verifyToken, getMessages);
router.get("/conversations", verifyToken, getConversations);
router.put("/messages/read", verifyToken, markMessagesAsRead);
router.delete("/messages/delete-for-me", verifyToken, deleteMessageForMe);
router.delete("/messages/delete-for-everyone", verifyToken, deleteMessageForEveryone);
router.delete("/messages/conversation", verifyToken, deleteConversation);
router.put("/messages/archive", verifyToken, archiveConversation);

export default router;
