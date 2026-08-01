const { StatusCodes } = require("http-status-codes");
const { User } = require("../models");
const { AppError } = require("../utils/customErrors");

const signupUser = async function(userSignupData){
    // the only job of the signup service to take the newUser data and save inside the db and return back to the controller 
    const newUser = new User(userSignupData);
    const savedUser = await newUser.save();
    return savedUser;
}

const loginUser = async function(emailId,password){

    //finding the user finside the db from email
    const user = await User.findOne({"emailId" : emailId})
    //checking if the user exist or not 
    if(!user) throw new AppError("Invalid credentials",StatusCodes.UNAUTHORIZED);

    //compare the password with our build Schema methods 
    const isPasswordMatch = await user.isPasswordMatch(password)

    if(!isPasswordMatch) throw new AppError("Invalid credentials",StatusCodes.UNAUTHORIZED)

    // token generate karenge yaha pe
    const token = await user.getJwtToken()

    return {token,user}
}



module.exports = {
    signupUser,
    loginUser
}