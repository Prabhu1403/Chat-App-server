import GroupMessage from "../models/groupmessage"
import MessageRead from "../models/messageread"
import {Op} from "sequelize"

export const createMesageRead = async (req:any,res:any)=>{
    try{
     const {groupId,userId} =req.body
     const unreadMessage = await GroupMessage.findAll({
        where:{
            groupId,
        }
     })

     for(let message of unreadMessage){
        const messageRead = await MessageRead.findOne({
            where:{
                messageId:message.id,
                userId,
            }
        })

        if(!messageRead){
            await MessageRead.create({
                messageId:message.id,
                userId,
                readAt:new Date(),
            })
        }

     }

     return res.json({
        success:true,
        message:"Message read successfully"
     })
    }catch(err){
      return res.json({
        success:false,
        message:"Failed to create message read"
      })
    }
}

export const getUnreadMessage = async(req:any,res:any)=>{
    try{        
        const {groupId,userId} = req.query;
        console.log("groupId for unread>>",groupId);
        console.log("userId>>",userId);
        
        const unreadMessage = await GroupMessage.findAll({
            where:{
                groupId,
                senderId: {
                    [Op.ne]: userId
                },
                "$reads.id$": { [Op.eq]: null }
            },
            include:[
                {
                    model:MessageRead,
                    as:'reads',
                    required:false,
                    where:{ userId },
                    attributes:['id','messageId','userId'],
                }
            ],
            subQuery: false
        })

      if(!unreadMessage){
        return res.status(200).json({
          success:false,
          message:"No unread messages"
        })
      }

      const unreadCount = await GroupMessage.count({
        where:{
            groupId,
            senderId: {
                [Op.ne]: userId
            },
            "$reads.id$": { [Op.eq]: null }
        },
        include:[
            {
                model:MessageRead,
                as:'reads',
                required:false,
                where:{ userId },
                attributes:['id','messageId','userId'],
            }
        ]
      })

        console.log("groupUnreadCount>>",unreadMessage,unreadCount);
        

        return res.status(200).json({
            success:true,
            unreadCount,
            unreadMessage
        })
    }catch(err){
        console.log(err);
        
     return res.status(500).json({
        success:false,
        message:"Failed to get unread message"
      })
    }
}