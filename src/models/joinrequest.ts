import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';


class JoinRequest extends Model {
    declare id: number;
    declare groupId: number;
    declare userId: string;
    declare status: 'pending' | 'accepted' | 'rejected';
    declare createdAt: Date;
}

JoinRequest.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        groupId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'groups',
                key: 'id'
            }
        },
        userId: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: 'users',
                key: 'userId'
            }
        },
        status: {
            type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
            defaultValue: 'pending'
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        sequelize,
        modelName: 'joinrequest',
        tableName: 'joinrequests',
        timestamps: true
    }
);

export default JoinRequest;