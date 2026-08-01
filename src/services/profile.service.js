const { StatusCodes } = require("http-status-codes")
const { AppError } = require("../utils/customErrors")
const { User } = require("../models")

const updateUser = async function(cleanUpdates, loggedInUser) {
    // Service ko pata hai ki uske paas jo data aaya hai, wo Controller verify kar chuka hai
    for(let key in cleanUpdates){
        loggedInUser[key] = cleanUpdates[key]
    }

    const savedUser = await loggedInUser.save();
    return savedUser;
}

const updatePassword = async function (loggedInUser, currentPassword, newPassword) {

    const isPasswordMatch = await loggedInUser.isPasswordMatch(currentPassword);
    
    if (!isPasswordMatch) {
        throw new AppError("Incorrect current password", StatusCodes.BAD_REQUEST);
    }

    loggedInUser.password = newPassword;
    await loggedInUser.save(); 
};

const deleteUser = async function(loggedInUser){

    const deletedUser = await loggedInUser.deleteOne();

    return deletedUser;
}
 
module.exports =  {
    updateUser,
    deleteUser,
    updatePassword
}