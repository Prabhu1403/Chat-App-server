import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";


class GroupMessage extends Model {
    declare id: number;
    declare groupId: number;
    declare senderId: string;
    declare message: string;
    declare isRead: boolean;
    declare is_forward: boolean;
    declare forwarded_from: string;
    declare createdAt: Date;
    declare updatedAt: Date;
}

GroupMessage.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    groupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'groups',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    senderId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'users',
            key: 'userId'
        },
        onDelete: 'CASCADE'
    },
    message: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    is_forward: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    forwarded_from: {
        type: DataTypes.STRING,
        allowNull: true
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'GroupMessage',
    tableName: 'groupmessages',
    timestamps: true
})

export default GroupMessage;