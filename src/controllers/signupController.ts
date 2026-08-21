import { Request, Response } from "express";
import bcrypt from "bcrypt";
import Users from "../models/user";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from 'uuid';

const signUpController = async (req: Request, res: Response) => {
    const { name, phone, email, password, userId } = req.body;
    console.log("signUpController", req.body);
    try {
        const finalUserId = userId || uuidv4();
        console.log("userId", finalUserId);

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);
        const existingUser = await Users.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists please login" });
        }

       const token = jwt.sign({ email }, process.env.JWT_SECRET!, { expiresIn: "1h" });

        const user = await Users.create({
            userId: finalUserId,

            name,
            phone,
            email,
            password: hashedPassword,
        });
        

        res.status(201).json({ 
            message: "User created successfully",
            token: token, 
            data:user
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
}

export default signUpController;