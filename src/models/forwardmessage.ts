import {DataTypes, Model} from "sequelize";
import { sequelize } from "../config/db";

class ForwardMessage extends Model {
    declare id: number;
    declare messageId: number;
    declare forwardFrom: string;
    declare forwardTo: string;
    declare createdAt: string;
}

ForwardMessage.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    messageId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'messages',
            key: 'id'
        }
    },
    forwardFrom: {
        type: DataTypes.STRING,
        allowNull: false
    },
    forwardTo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'ForwardMessage',
    tableName: 'forward_messages',
    timestamps: true
});

export default ForwardMessage;