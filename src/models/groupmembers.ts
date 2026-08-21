import { DataTypes,Model } from 'sequelize';
import { sequelize } from '../config/db';


class GroupMembers extends Model {
    declare id:number;
    declare groupId:number;
    declare userId:string;
}

GroupMembers.init({
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
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'users',
            key: 'userId'
        },
        onDelete: 'CASCADE'
    },
    joinedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'GroupMembers',
    tableName: 'groupmembers',
    timestamps: false
})

export default GroupMembers;