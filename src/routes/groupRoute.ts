import { Router } from "express";
import { verifyToken } from "../middleware/authmiddleware";
import { createGroup,getGroupMessage, getGroups, joinRequest, getOwnerJoinRequests, acceptJoinRequest, rejectJoinRequest, markMessageAsRead, getLastMessage, deleteGroup } from "../controllers/groupController";
import { createMesageRead, getUnreadMessage } from "../controllers/groupMessageReadcontroller";

const router = Router();


router.post('/creategroup', verifyToken, createGroup)
router.get('/getgroups', verifyToken, getGroups)
router.post('/join-request', verifyToken, joinRequest)

router.get('/join-requests/:userId', verifyToken, getOwnerJoinRequests)
router.post('/accept-requests/:id', verifyToken, acceptJoinRequest)
router.post('/reject-requests/:id', verifyToken, rejectJoinRequest)
router.get('/getGroupMessage', verifyToken,getGroupMessage)
router.put('/markMessageAsRead/:groupId', verifyToken,markMessageAsRead)
router.get('/getLastMessage/:groupId', verifyToken,getLastMessage)
router.post('/createMessageRead', verifyToken, createMesageRead)
router.get('/getUnreadMessage', verifyToken, getUnreadMessage)
router.delete('/deleteGroup/:id', verifyToken, deleteGroup)
export default router