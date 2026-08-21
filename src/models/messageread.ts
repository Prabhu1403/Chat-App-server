import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";

class MessageRead extends Model {
    declare id: number;
    declare messageId: number;
    declare userId: string;
    declare readAt: Date;
}

MessageRead.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    messageId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'groupmessages',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'users',
            key: 'userId'
        },
        onDelete: 'CASCADE'
    },
    readAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'MessageRead',
    tableName: 'messagereads',
    timestamps: false
});

export default MessageRead;
