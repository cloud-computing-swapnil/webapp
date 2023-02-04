import dotenv from "dotenv"
dotenv.config()

export const dbEnvConfig = {
    development: {
        HOST: "localhost",
        USER: "postgres",
        PASSWORD: "Swapnil@123",
        DB: "postgres",
        PORT: 5432,
        dialect: "postgres",
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    },
    test: {
        HOST: process.env.DB_HOST,
        USER: process.env.DB_USER,
        PASSWORD: process.env.DB_PASSWORD,
        DB: process.env.DB_TEST_DATABASE,
        PORT: process.env.DB_PORT,
        dialect: "postgres",
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
};