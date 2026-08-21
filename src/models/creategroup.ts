import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db"

class CreateGroup extends Model {
    declare id: number;
    declare name: string;
    declare description: string;
    declare photoUrl: string;
    declare createdBy: string;
    declare createdAt: string;
}

CreateGroup.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    photoUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    createdBy: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'users',
            key: 'userId'
        },
        onDelete: 'CASCADE',
    },
    createdAt: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'Group',
    tableName: 'groups',
    timestamps: true
});

export default CreateGroup;