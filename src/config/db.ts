import { Sequelize } from  "sequelize";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();


const sequelize = process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, {
        dialect: "postgres",
        dialectModule: pg,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
    })
    : new Sequelize(
        process.env.DB_NAME?.trim() || "ChatApp",
        process.env.DB_USER?.trim() || "postgres",
        process.env.DB_PASSWORD?.trim() || "postgres",
        {
            host: process.env.DB_HOST?.trim() || "localhost",
            port: Number(process.env.DB_PORT?.trim()) || 5432,
            dialect: "postgres",
            dialectModule: pg,
            logging: false,
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000,
            },
        }
    );


async function connect() {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ alter: true }); // creates/updates tables automatically
        console.warn("Database connection established successfully");
    } catch (error) {
        console.error("Unable to connect to the database:", error);
    }
}
export { sequelize, connect };