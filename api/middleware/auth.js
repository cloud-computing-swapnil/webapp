import {setResponse} from "../controllers/index.js";

import client from "../config/DBConnection.js";
import bcrypt from "bcrypt";
import db from "../models/index.js";
const User = db.users

export const basicAuth = async (req, res, next) => {
    // If 'Authorization' header not present
    if(!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1){
        return setResponse({message: "Missing Authorization Header"}, 401, res)
    } else {
        // Decode the 'Authorization' header Base64 value
        const [username, password] = Buffer.from(req.get('Authorization').split(' ')[1], 'base64')
            // <Buffer 75 73 65 72 6e 61 6d 65 3a 70 61 73 73 77 6f 72 64>
            .toString()
            // username:password
            .split(':')
        // ['username', 'password']

        console.log("Middleware username: "+ username)
        console.log("Middleware pwd: "+ password)

        const foundUser = await User.findOne({
                where: {username},
            })
            .catch((error)=>  setResponse(error, 400, res))

        if(!foundUser)
            return setResponse({message: "Please check username. Authorization in Middleware failed"}, 401, res)

        const validPassword = await bcrypt.compare(password, foundUser.password);
        if (!validPassword)
            return setResponse({message: "Password incorrect. Authorization in Middleware failed"}, 401, res)

        console.log("Middleware found User"+ typeof foundUser.id)
        req.currUser = {
            id: foundUser.id,
            username: foundUser.username,
            password: foundUser.password
        }
        // Continue the execution
        next()

    }
}
