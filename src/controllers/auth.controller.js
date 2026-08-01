const { StatusCodes, ReasonPhrases } = require('http-status-codes')
const AuthService = require('../services/auth.service')
const { signupValidator, loginValidator } = require('../utils/validators');
const { AppError } = require('../utils/customErrors');

const signup = async function (req, res, next) {
    //controller he saare error ko catch karta hai baaki sab error ko throw karet hai 
    try {
        const validatedUserData = signupValidator(req.body);
        const savedUser = await AuthService.signupUser(validatedUserData);

        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: ReasonPhrases.CREATED,
            data: savedUser,
            error: null
        })

    } catch (error) {
        //aur jab globalErrorHandler ho to fir controller bhi just error ko pass karta hai 
        next(error)
    }

}

const login = async function (req, res, next) {
    try {

        // validate the login infor by extracting the email and password from the req.body
        const { emailId, password } = loginValidator(req.body);
        const {token,user} = await AuthService.loginUser(emailId, password);

        //setting the cookies here 
        res.cookie("token", token)
        return res.status(StatusCodes.OK).json({
            success: true,
            message: ReasonPhrases.OK,
            data: user,
            error: null
        })

    } catch (error) {

        next(error)
    }
}

const logout = async function (req, res, next) {

        // 1. Cookie ko hamesha ke liye mita do
        res.clearCookie("token", {
            expires: new Date()
        });

        // 2. Success response bhej do
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Logout successful! Come back soon.",
            data: null,
            error: null
        });

}

module.exports = {
    signup,
    login,
    logout
}