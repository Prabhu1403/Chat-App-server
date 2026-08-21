import { Socket, Server } from "socket.io";
import GroupMessage from "../models/groupmessage";
import { Group } from "../models/associations";
import { Model, Op } from "sequelize";
import MessageRead from "../models/messageread";

export function registerGroupHandlers(io: Server, socket: Socket) {
  // Join a group room
  socket.on("join_room", (groupId: string) => {
    socket.join(`group-${groupId}`);
  });

  // Send a message to a group room
  socket.on("send_group_message", async (data: any) => {
    try {
      console.log("Group Message Data:", data);
      console.log("senderID", data.senderId);
      console.log(data.room);

      const getgroup: any = await Group.findOne({ where: { name: data.room } });
      console.log("Group ID:", getgroup);

      if (!getgroup) {
        console.error(`Group not found for room: ${data.room}`);
        return;
      }

      const savedMessage = await GroupMessage.create({
        groupId: getgroup.id,
        senderId: data.senderId,
        message: data.message,
        is_forward: data.is_forward || false,
        forwarded_from: data.forwarded_from || null
      });

      io.to(`group-${getgroup.id}`).emit("receive_group_message", savedMessage);
    } catch (error) {
      console.error("Error in send_group_message:", error);
    }
  });

  socket.on("get_group_unread_message", async (data: any, callback?: any) => {
    try {
      const { groupId, userId } = data;
      if (!groupId || !userId) {
        return callback?.({ success: false, message: "groupId and userId are required" });
      }

      const unReadMessages = await GroupMessage.count({
        where: {
          groupId,
          senderId: {
            [Op.ne]: userId
          },
          "$reads.id$": { [Op.eq]: null }
        },
        include: [
          {
            model: MessageRead,
            as: 'reads',
            required: false,
            where: {
              userId
            },
            attributes: ['id','messageId','userId']
          }
        ]
      });

const unreadCount = unReadMessages;
      callback?.({ success: true, unreadCount });
    } catch (error) {
      console.error("Error in get_unread_message:", error);
      callback?.({ success: false, message: "Internal server error" });
    }
  })

  socket.on("create_message_read",async (data:any,callback?:any)=>{
    const {groupId,userId}=data
    try{
      const getMessage:any = await GroupMessage.findAll({
        where:{
          groupId
        }
      })

      for(const msg of getMessage){
        const isRead= await MessageRead.findOne({
          where:{
            messageId:msg.id,
            userId
          }
        })

        if(!isRead){
          await MessageRead.create({
            messageId:msg.id,
            userId,
            readAt:new Date(),
          })
        }
        
      }

      io.to(`group-${groupId}`).emit("readMessage",{
        groupId:groupId,
        userId:userId
      })
      callback?.({success:true,message:"Message read successfully"})
    }catch(error){
      console.error("Error in create_message_read:", error);
      callback?.({success:false,message:"Internal server error"})
    }
    
  })


}
