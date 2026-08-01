const jwt = require('jsonwebtoken')
const { User } = require('../../models')
const { AppError } = require('../../utils/customErrors'); // Tera custom error class
const { StatusCodes } = require('http-status-codes');

async function userAuth (req, res, next) {
    try {
        // 1. Token nikalna
        const { token } = req.cookies;

        if (!token) {
            throw new AppError("Invalid Token. Please Login Again", StatusCodes.UNAUTHORIZED);
        }

        // 2. Token verify karna
        const jwtPayload = jwt.verify(token, process.env.JWT_TOKEN_KEY);
        const { _id } = jwtPayload;
        
        // 3. User dhoondhna
        const user = await User.findById(_id);
        if (!user) {
            res.clearCookie("token");
            throw new AppError("User no longer exists. Session cleared.", StatusCodes.UNAUTHORIZED);
        }

        // 4. Sab theek hai toh aage bhej do
        req.user = user;
        return next();

    } catch (error) {
        // 🚨 MAGIC: Ab hum yahan res.status() nahi likhenge!
        
        // Agar error JWT ki taraf se aaya hai, toh usko pakad kar AppError me convert karo
        if (error.name === 'TokenExpiredError') {
            return next(new AppError("Session Expired! Please login again.", StatusCodes.UNAUTHORIZED));
        } 
        if (error.name === 'JsonWebTokenError') {
            return next(new AppError("Invalid Token! Unauthorized access.", StatusCodes.UNAUTHORIZED));
        }

        // Agar koi aur anjaan error hai (jaise Database crash), toh seedha next me daal do
        next(error);
    }
}

module.exports = {
    userAuth
}