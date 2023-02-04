import pg from "pg"
const { Client } = pg
import dotenv from "dotenv"
dotenv.config()

const client = new Client({
    host: "localhost",
    user: "root",
    port: 5432,
    password: "Swapnil@123",
    database: "postgres"
})

export default client