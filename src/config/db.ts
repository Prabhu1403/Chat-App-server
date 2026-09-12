import { Sequelize } from  "sequelize";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();


// const sequelize = new Sequelize(
//     process.env.DB_NAME!,
//     process.env.DB_USER!,
//     process.env.DB_PASSWORD!,
//     {
//     host: process.env.DB_HOST,
//     port: Number(process.env.DB_PORT),
//     dialect: "postgres",
//     logging:false,
//     pool: {
//             max: 5,
//             min: 0,
//             acquire: 30000,
//             idle: 10000
//         }
// });

const sequelize = new Sequelize(process.env.DATABASE_URL!, {
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
        idle: 10000
    }
});


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