import { Router } from "express";
import { getProfile, updateProfile, getReceiverProfile } from "../controllers/usersProfileController";
import { verifyToken } from "../middleware/authmiddleware";
import { uploades } from "../config/multer";


const router = Router();


router.get('/get-profile/:userId', verifyToken, getProfile);
router.put('/update-profile/:userId', verifyToken,uploades.single("profilePicture"), updateProfile);
router.get('/get-receiver-profile', verifyToken, getReceiverProfile);

export default router;