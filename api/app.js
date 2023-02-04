import express from "express"
import cors from "cors"
import routes from "./routes/index.js"

const app = express()
app.use(express.json()) //Helps to parse JSON body
app.use(express.urlencoded({extended: true}))
app.use(cors())
routes(app)

export default app;