import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";
import Conversation from "./conversation";

class Message extends Model {
    declare id: number;
    declare senderId: string;
    declare receiverId: string;
    declare message: string;
    declare timestamp: string;
    declare status: string;
    declare isRead: boolean;
    declare is_delete_for_everyone: boolean;
    declare delete_for_me_ids: string[];
    declare is_forward: boolean;
    declare forward_ids: string[];
    declare forwarded_from: string;
    declare conversation_id: string | null;
}

Message.init({
    id: {
        type: DataTypes.INTEGER, 
        primaryKey: true,
        autoIncrement: true
    },
    senderId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    receiverId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_delete_for_everyone:{
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },

    delete_for_me_ids:{
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: []
    },
     is_forward:{
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    forwarded_from:{
        type: DataTypes.STRING,
        allowNull: true
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue:new Date(),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM("sent","delivered","seen")
    },
    conversation_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references:{
            model:Conversation,
            key:"id"
        }
    }
}, 
 {
    sequelize,
    modelName: 'Message',
    tableName: 'messages',
    timestamps: true
});

export default Message;
