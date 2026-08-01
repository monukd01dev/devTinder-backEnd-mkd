const { StatusCodes } = require("http-status-codes");
const { User, ConnectionRequest } = require("../models");
const { AppError } = require("../utils/customErrors");


const sendRequest = async function (toUserId, fromUserId, status) { 

    // 1. Is the target user existing?
    const toUser = await User.findById(toUserId);
    if (!toUser) {
        // Removed stray text & removed direct HTTP status code dependency
        throw new AppError(`Target user doesn't exist!`,StatusCodes.NOT_FOUND); 
    }

    // 2. Checking for existing connections
    const isRequestAlreadyExists = await ConnectionRequest.findOne({
        $or: [
            { toUserId, fromUserId },
            { toUserId: fromUserId, fromUserId: toUserId }
        ]
    });

    if (isRequestAlreadyExists) {
        throw new AppError(`Connection request already exists between you two.`,StatusCodes.BAD_REQUEST);
    }

    // 3. Save to DB (Ab isko status variable mil jayega)
    const newConnectionRequest = new ConnectionRequest({
        toUserId,
        fromUserId,
        status
    });
    
    const conRequest = await newConnectionRequest.save();

    return conRequest;
}

const reviewRequest = async function (loggedInUserId,requestId,status) {

    /**
     * Is requestId exists
                kya ye request isi user ke hai jo review kar raha hai 
                kya ye request interested state me hai ya nhi  
                to agar request exist bhi karti hai mereliye he hai aur status interested bhi hai to fir mai is ✅ ya ❎ kar sakta hune
     */

    const connectionRequest = await ConnectionRequest.findOne({
        _id : requestId,
        toUserId : loggedInUserId,
        status : 'interested'
    })

    if(!connectionRequest) throw new AppError("Connection request not found or invalid", StatusCodes.NOT_FOUND)

    connectionRequest.status = status;
    return await connectionRequest.save()
}

module.exports = {
    sendRequest,
    reviewRequest
}