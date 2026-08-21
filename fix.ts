import { sequelize } from "./src/config/db";

async function run() {
    try {
        await sequelize.query('ALTER TABLE "messages" DROP COLUMN "is_delete_for_me";');
        console.log("Column dropped successfully.");
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
