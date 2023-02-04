import {dbEnvConfig} from "../config/config.js";
import {Sequelize} from "sequelize";
import {userModel} from "./User.js";
import dotenv from "dotenv"
dotenv.config()

const env = process.env.NODE_ENV || 'development';
const dbConfig = dbEnvConfig[env]

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    port: dbConfig.PORT,
    dialect: dbConfig.dialect,

    pool: {
        max: dbConfig.pool.max,
        min: dbConfig.pool.min,
        acquire: dbConfig.pool.acquire,
        idle: dbConfig.pool.idle
    }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.users = userModel(sequelize, Sequelize);

// db.connectionTest = async (req, res) => {
//     try {
//         await sequelize.authenticate()
//         console.log(`Successfully connected to database "${dbConfig.DB}"`)
//     } catch (error) {
//         console.error(`Unable to connect to the database "${dbConfig.DB}":`, error)
//     }
// }

export default db