import { Request, Response } from "express";
import Users from "../models/user";

export const getProfile = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const user = await Users.findOne({ where: { userId } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ data: user });
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getReceiverProfile = async (req: Request, res: Response) => {
    try {
        const { chatNumber } = req.query;

        if (!chatNumber) {
            return res.status(400).json({
                message: "Chat number is required",
            });
        }

        const receiverProfile = await Users.findOne({
            where: {
                phone: chatNumber as string,
            },
        });

        if (!receiverProfile) {
            return res.status(404).json({
                message: "Receiver profile not found",
            });
        }

        return res.status(200).json({
            message: "Receiver profile fetched successfully",
            data:receiverProfile,
        });
    } catch (error) {
        console.error("Error fetching receiver profile:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};
export const updateProfile = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const name = req.body.name || req.body.data?.name;
        const phone = req.body.phone || req.body.data?.phone;
        const bio = req.body.bio !== undefined ? req.body.bio : req.body.data?.bio;
        const profilePicture = req.file?.filename ? `http://localhost:8000/uplodes/images/${req.file.filename}` : undefined;
        
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const user = await Users.findOne({ where: { userId } });
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update fields
        user.name = name || user.name;
        user.phone = phone || user.phone;
        user.bio = bio !== undefined ? bio : user.bio;
        user.profilePicture = profilePicture !== undefined ? profilePicture : user.profilePicture;

        await user.save();

        res.status(200).json({ 
            message: "Profile updated successfully", 
            data: user 
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};