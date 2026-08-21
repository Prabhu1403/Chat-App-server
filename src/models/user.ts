import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";

class Users extends Model {
    declare id:number;
    declare userId:string|null;
    declare name:string;
    declare phone:number|string;
    declare email:string;
    declare password:string;
    declare profilePicture:string|null;
    declare bio:string|null;
}

Users.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId:{
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    profilePicture: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    isOnline:{
        type:DataTypes.BOOLEAN,
        allowNull:true,
        defaultValue:false
    },
    lastSeen: {
        type: DataTypes.DATE,
        allowNull: true
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'Users',
    tableName: 'users',
    timestamps: true
})

export default Users;