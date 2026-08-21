import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";

class ConversationMembers extends Model {
    declare id: string;
    declare conversation_id: string;
    declare user_id: string;
    declare joined_at: Date;
    declare role: string;
    declare is_archived: boolean;
    declare is_muted: boolean;
    declare is_pinned: boolean;
    declare last_read_message_id: number | null;
    declare deleted_at: Date | null;
}

ConversationMembers.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    conversation_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    user_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    joined_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    },
    is_archived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_muted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_pinned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    last_read_message_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'ConversationMembers',
    tableName: 'conversation_members',
    timestamps: false
});

export default ConversationMembers;
