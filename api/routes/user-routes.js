import express from "express";
import * as userController from "./../controllers/user-controller.js"
import {basicAuth} from "../middleware/auth.js";

const Router = express.Router()

// Routes to create a new user
Router.route("/")
    .post(userController.create)  //Passing the function and not invoking the function

//routes for specific user
Router.route("/:id")
    .get(basicAuth, userController.get)
    .put(basicAuth, userController.update)

//login route
Router.route("/login")
    .post(userController.login)

export default Router;
