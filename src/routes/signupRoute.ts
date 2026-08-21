import { Router } from "express";
import signUpController from "../controllers/signupController";
import loginController from "../controllers/loginController";

const router = Router();


router.post('/signup',signUpController);
router.post('/login',loginController);


export default router;