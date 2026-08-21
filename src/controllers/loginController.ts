import { Request, Response } from "express";
import bcrypt from "bcrypt";
import Users from "../models/user";
import jwt from "jsonwebtoken";


const loginController = async (req:Request,res:Response)=>{
    try {
        const {email,password,rememberMe} = req.body;
        console.log("Login attempt:", { email, rememberMe });
        const existingUser = await Users.findOne({ where: { email } });
        if (!existingUser) {
            return res.status(404).json({ message: "User not found please SignUP" });
        }
        const validPassword = bcrypt.compareSync(password, existingUser.password);
        if (!validPassword) {
            console.warn("Invalid password for email:", email);
            return res.status(401).json({ message: "Invalid password" });
        }
       
        const token = jwt.sign({ email }, process.env.JWT_SECRET!,{expiresIn:rememberMe?"7d":"1h"});
       
            res.cookie("token", token, {
                httpOnly: true,
                secure: true, // Set to true in production with HTTPS
                sameSite: "strict",
                maxAge: rememberMe
                    ? 7 * 24 * 60 * 60 * 1000
                    : 1 * 24 * 60 * 60 * 1000,
            });

        res.status(200).json({ message: "Login successful", token, rememberMe, data: existingUser });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
}

export default loginController;




