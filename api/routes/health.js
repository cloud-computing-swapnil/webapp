import express from "express"
import {setResponse} from "../controllers/index.js";
const Router = express.Router()

// Routes to check health
Router.route("/")
    .get(
        (req, res) => {
            try{
                setResponse("Success", 200, res)
            } catch (error) {
                setResponse(error, 500, res)
            }
        }
    )

export default Router;
