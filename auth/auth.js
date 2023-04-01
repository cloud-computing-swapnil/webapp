const { User } = require('../models');
const bcrypt = require("bcrypt");
const helper = require('../config/winston');
const BasicAuth = async (req, res, next) => {
    // check if authorization header is present
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
        helper.logger.error("Authorization header missing - Unauthorized");
        return res.status(401).json({
            message: 'Missing Authorization Header'
        })
    }
    // verify auth credentials
    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');

    // if email and password are null
    if (email == "" || password == "") {
        helper.logger.error("Incorrect user details - Unauthorized");
        return res.status(400).json({
            message: 'Bad Request'
        })
    }


    //get user with emailid
    //TODO: Verify with TA??
    const user = await User.findOne({ where: { username: email } });
    if (!user) {
        helper.logger.error("Plz enter valid user email address");
        return res.status(401).json({
            message: 'Bad Request'
        })
    }
    // verify password
    // const isPasswordMatch = await user.password === password;
    const isPasswordMatch =  bcrypt.compareSync(password, user.password);
    if (!isPasswordMatch) {
        helper.logger.error("Password not match");
        console.log("Password not match");
        return res.status(401).json({
            message: 'Invalid Authentication Credentials'
        })
    }
    // verify if user is trying to access his own account
    // if (req.params.id){
    //     if (user.id !== parseInt(req.params.id)) {
    //         return res.status(403).json({
    //             message: 'Forbidden Resource'
    //         }),
    //             console.log("User not match");
    //     }
    // }
    // authentication successful
    req.response = user.dataValues;


    next();
}

module.exports = BasicAuth;
