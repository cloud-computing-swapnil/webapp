import UserRouter from "./user-routes.js";
import HealthRouter from "./health.js"

import {setResponse} from "../controllers/index.js";


export default (app) => {
    app.use("/v1/user", UserRouter)
    app.use("/healthz", HealthRouter)
    app.use("*", (req, res)=> setResponse({message: "Invalid Route"}, 404, res))
}