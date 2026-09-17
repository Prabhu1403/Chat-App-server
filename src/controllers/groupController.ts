import { Request, Response } from "express";
import { Op } from "sequelize";
import { AuthRequest } from "../middleware/authmiddleware";
import Group from "../models/creategroup";
import JoinRequest from "../models/joinrequest";
import User from "../models/user";
import { Socket } from "socket.io";
import { io } from "../server";
import { onlineUsers } from "../Sockets";
import GroupMembers from "../models/groupmembers";
import GroupMessage from "../models/groupmessage";
import { group } from "node:console";
import { where } from "sequelize";


export const createGroup = async (req: Request, res: Response) => {
    try {
        const { name, description, photoUrl, createdBy } = req.body
        const existsName = await Group.findOne({ where: { name } })
        if (existsName) {
            return res.status(400).json({ message: "Group name already exists" });
        }
        const createdAt = new Date().toISOString();
        const group = await Group.create({ name, description, photoUrl, createdBy, createdAt })
        return res.status(201).json({ message: "Group created successfully", group })
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}



export const getGroups = async (req: Request, res: Response) => {
    try {
        const groups = await Group.findAll({
            order: [["createdAt", "DESC"]],
            include: [{
                model: User,
                as: 'members',
                attributes: ['userId']
            }]
        });

        return res.status(200).json({ groups });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const getMyGroups = async(req:AuthRequest,res:Response)=>{
   try{
     const userId = req.params.userId;
     if(!userId){
      return res.status(401).json({ message: "Unauthorized" });
     }

     const groupMember = await GroupMembers.findAll({where:{userId:userId}});
     const groupIds = groupMember.map(groupMember=>groupMember.groupId);
     const groups = await Group.findAll({
        where:{
            [Op.or]:[
                {createdBy:userId},
                ...(groupIds.length > 0 ? [{ id: groupIds }] : [])
            ]
           },order:[['createdAt','DESC']],include:[{model:User,as:'members',attributes:['userId']}]});
     return res.status(200).json({groups});

   }catch(err){
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
   }
}

export const joinRequest = async (req: Request, res: Response) => {
    try {
        const { groupId, userId } = req.body
        const group = await Group.findByPk(groupId)
        const user = await User.findOne({ where: { userId: userId } })
        const alreadyMember = await GroupMembers.findOne({ where: { groupId, userId } })
        const alreadyRequested = await JoinRequest.findOne({ where: { groupId, userId, status: 'pending' } })
        const ownerId = group?.createdBy;

        switch (true) {
            case !!alreadyMember:
                return res.status(400).json({ message: "You are already a member of this group" });

            case !!alreadyRequested:
                return res.status(400).json({ message: "you already send join request please wait to owner accept" });

            case !group:
                return res.status(404).json({ message: "Group not found" });

            case !user:
                return res.status(404).json({ message: "User not found" });

            case ownerId === userId:
                return res.status(400).json({ message: "You are already a member of this group" });

            default: {
                if (ownerId) {
                    const ownerSocketId = onlineUsers.get(ownerId);
                    if (ownerSocketId) {
                        io.to(ownerSocketId).emit("new-join-request", {
                            message: "New join request received",
                            groupId,
                            userId
                        });
                    }
                }
                break;
            }
        }

        const joinRequest = await JoinRequest.create({ groupId, userId })
        return res.status(201).json({ message: "Request sent successfully", joinRequest })
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" })
    }
}

export const getOwnerJoinRequests = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.params.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const groups = await Group.findAll({ where: { createdBy: userId } });
        const groupIds = groups.map(g => g.id);

        if (groupIds.length === 0) {
            return res.status(200).json({ requests: [] });
        }

        const requests = await JoinRequest.findAll({
            where: {
                groupId: groupIds,
                status: 'pending'
            },
            order: [['createdAt', 'DESC']]
        });

        const userIds = [...new Set(requests.map(r => r.userId))];
        const users = await User.findAll({ where: { userId: userIds } });
        const userMap = new Map(users.map(u => [u.userId, u]));
        const groupMap = new Map(groups.map(g => [g.id, g]));

        const enrichedRequests = requests.map(r => ({
            id: r.id,
            groupId: r.groupId,
            groupName: groupMap.get(r.groupId)?.name || 'Unknown Group',
            userId: r.userId,
            userName: userMap.get(r.userId)?.name || 'Unknown User',
            userPhoto: userMap.get(r.userId)?.profilePicture || null,
            status: r.status,
            createdAt: r.createdAt
        }));

        return res.status(200).json({ requests: enrichedRequests });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const acceptJoinRequest = async (req: AuthRequest, res: Response) => {
    try {
        const requestId = req.params.id;
        console.log("requestId>>>", requestId);

        const request = await JoinRequest.findOne({ where: { userId: requestId } });
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        const user = await User.findOne({ where: { userId: request.userId } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        request.status = 'accepted';
        await request.save();

        const newMember = await GroupMembers.create({
            groupId: request.groupId,
            userId: user.userId,
            joinedAt: new Date()
        });

        return res.status(200).json({ message: "Request accepted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const rejectJoinRequest = async (req: AuthRequest, res: Response) => {
    try {
        const requestId = Number(req.params.id);
        const request = await JoinRequest.findByPk(requestId);
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        request.status = 'rejected';
        await request.save();

        return res.status(200).json({ message: "Request rejected successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const getGroupMessage = async (req: AuthRequest, res: Response) => {
    try {
        const groupId = req.query.groupId;
        const userId = req.query.userId;
        console.log("groupId>>>", groupId);
        console.log("userId>>>", userId);

        let unreadCount = 0;
        if (!groupId) {
            return res.status(401).json({ message: "groupid not found" });
        }


        const groupMessage = await GroupMessage.findAll({ where: { groupId }, order: [["createdAt", "DESC"]] });

        // Count unread messages that are NOT sent by the current user
        unreadCount = groupMessage.filter((msg: any) => msg.senderId !== userId && msg.isRead === false).length;
        console.log("unreadCount>>>", unreadCount);

        return res.status(200).json({ groupMessage, unreadCount });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const getLastMessage = async (req: AuthRequest, res: Response) => {
    try {
        const groupId = Number(req.params.groupId);
        const userId = req.user?.userId || req.user?.id;
        if (!groupId) {
            return res.status(401).json({ message: "groupid not found" });
        }


        const message = await GroupMessage.findOne({ where: { groupId }, order: [["createdAt", "DESC"]] });

        const lastMessage = message?.dataValues;

        return res.status(200).json({ lastMessage });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}


export const markMessageAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const groupId = req.params.groupId;
        if (!groupId) {
            return res.status(401).json({ message: "groupID not found" })

        }

        await GroupMessage.update(
            { isRead: true },
            { where: { groupId, isRead: false, } }
        )
        return res.status(200).json({ message: "Messages marked as read successfully" })

    } catch (error) {
        console.error("Error marking messages as read:", error);
        return res.status(500).json({ message: "Failed to mark messages as read" });
    }
}

export const deleteGroup = async (req: AuthRequest, res: Response) => {
    try {
        const groupId = req.params.id as string;
        const userId = req.user?.userId || req.user?.id;

        const group = await Group.findByPk(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (group.createdBy !== userId) {
            return res.status(403).json({ message: "Only the group creator can delete this group" });
        }

        await Group.destroy({ where: { id: groupId } });
        await GroupMembers.destroy({ where: { groupId } });
        await GroupMessage.destroy({ where: { groupId } });
        await JoinRequest.destroy({ where: { groupId } });

        return res.status(200).json({ message: "Group deleted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
