//search a particular to-do object
import {setResponse} from "./index.js";
import bcrypt from "bcrypt";

import client from "../config/DBConnection.js";
import db from "../models/index.js";
const User = db.users


//express app invokes the function to create new user
export const create = async (req, res) => {
    try{


        //Check if User with the same email already exists
        const existingUser = await User.findOne({
            where: {
                username: req.body.username,
            },
        }).catch((error)=>  setResponse(error, 400, res))

        if(existingUser)
            return setResponse({message: "Username already exists"}, 400, res)

        const user = req.body
        if(!user.first_name || !user.last_name || !user.username || !user.password)
            return setResponse({message: "Username, Firstname, Lastname and Password are mandatory fields"}, 400, res)
        const validEmail = String(user.username)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            )
        if(!validEmail)
            return setResponse({message: "Username should be an Email ID"}, 400, res)

        const salt = await bcrypt.genSalt()
        user.password = await bcrypt.hash(user.password, salt)

        //Ignore this condition
        // if(user.account_created || user.account_updated || user.id)
        //     return setResponse({message: "ID, Account created and updated are read only fields"}, 400, res)

        await User.create(user)
            .then((createdUser)=>{
                const responseObj = {
                    id: createdUser.id,
                    first_name: createdUser.first_name,
                    last_name: createdUser.last_name,
                    username: createdUser.username,
                    account_created: createdUser.account_created,
                    account_updated: createdUser.account_updated
                }
                return setResponse(responseObj, 201, res)})
            .catch((error)=> setResponse(error, 400, res))

    } catch (error) {
        return setResponse(error, 400, res)
    }

}

export const login = async (req, res) => {
    try{
        const user = req.body
        let existingPassword = ""
        let validPassword = false
        client.query(`Select password from users where username='${req.body.username}'`, async (err, result)=>{
            try{
                if(result.rows.length===0){
                    console.log("No such user")
                    return setResponse({message: "Please check username"}, 400, res)
                }

                existingPassword = result.rows[0].password
                console.log("Existing Pwd: "+ existingPassword)
                console.log("Body Pwd: "+ user.password)
                validPassword = await bcrypt.compare(user.password, existingPassword);
                console.log(validPassword)
                if (!validPassword)
                    return setResponse({message: "Password incorrect"}, 400, res)

                //Obtain Base64 encoding
                const concatString = user.username+":"+req.body.password;
                console.log("concatString in login"+concatString)
                const base64String = genBase64(concatString)
                console.log("Base 64 on login of user: "+base64String)

                return setResponse({base64: base64String}, 200, res)

            }catch (error) {
                return setResponse(error, 400, res)
            }
        });

        client.end;
    } catch (error) {
        return setResponse(error, 400, res)
    }
}

export const get = async (req, res) => {   //Search by id - auth required
    try{
        //convert ID of currUser obtained from Middleware to a string because req.params.id is of type String
        if(req.currUser.id.toString()!==req.params.id)
            return setResponse({message: "You don't have access to this User account"}, 403, res)

        const foundUser = await User.findOne({
                where: { id: req.params.id }
            })
            .catch((error)=>  setResponse(error, 400, res))

        if(!foundUser)
            return setResponse({message: "No such user. Please check id"}, 400, res)

        const responseObj = {
            id: foundUser.id,
            first_name: foundUser.first_name,
            last_name: foundUser.last_name,
            username: foundUser.username,
            account_created: foundUser.account_created,
            account_updated: foundUser.account_updated
        }
        return setResponse(responseObj, 200, res)

    } catch (error){
        return setResponse(error, 400, res)
    }
}

//Update user info - auth required
export const update = async (req, res) => {
    try{
        const user = req.body

        if(!user.first_name && !user.password && !user.last_name)
            return setResponse({message: "Provide body to update"}, 400, res)

        if(req.currUser.id.toString()!==req.params.id)
            return setResponse({message: "You don't have access to this User account"}, 403, res)

        if(user.username)
            return setResponse({message: "Username cannot be updated"}, 400, res)

        if(user.account_created || user.account_updated || user.id)
            return setResponse({message: "ID, Account created and updated are read only fields"}, 400, res)

        const salt = await bcrypt.genSalt()
        user.password = await bcrypt.hash(user.password, salt)

        await User.update(user, {
                where: { id: req.currUser.id },
                returning: true
            })
            .then(async ()=>{
                const updatedUser = await User.findOne({
                    where: { id: req.params.id }
                }).catch((error)=>  setResponse(error, 400, res))

                const responseObj = {
                    id: updatedUser.id,
                    first_name: updatedUser.first_name,
                    last_name: updatedUser.last_name,
                    username: updatedUser.username,
                    account_created: updatedUser.account_created,
                    account_updated: updatedUser.account_updated
                }
            return setResponse(responseObj, 204, res)
            })
            .catch((error)=> setResponse(error, 400, res))

    } catch(error) {
        return setResponse(error, 400, res)
    }
}

const genBase64 = (concatString) => {
    const bufferObj = Buffer.from(concatString, "utf8");

    // Encode the Buffer as a base64 string
    const base64String = bufferObj.toString("base64");
    return base64String
}