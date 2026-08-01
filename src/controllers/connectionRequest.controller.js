const { StatusCodes } = require('http-status-codes');
const connectionRequestService = require('../services/connectionRequest.service');
const { AppError } = require('../utils/customErrors');
const validator = require('validator')

const sendConnectionRequest = async function (req, res, next) {
    try {
        const loggedInUser = req.user;
        const fromUserId = loggedInUser._id;
        const { status, toUserId } = req.params;

        // 1. Validating the status
        const allowedStatusValues = ["ignored", "interested"];
        if (!allowedStatusValues.includes(status)) {
            throw new AppError(`Invalid status value. Only 'ignored' and 'interested' are allowed.`, StatusCodes.BAD_REQUEST);
        }

        // 2. Validate ObjectID format
        if (!validator.isMongoId(toUserId)) {
            throw new AppError("Invalid User ID!", StatusCodes.BAD_REQUEST);
        }

        // 3. Passing ALL required data to the Service
        const sendedConnection = await connectionRequestService.sendRequest(toUserId, fromUserId, status);

        // 4. Success Response
        return res.status(StatusCodes.OK).json({
            success: true,
            message: status === "interested" ? "Connection request sent successfully!" : "Profile ignored.",
            data: sendedConnection,
            error: null
        });

    } catch (error) {
        next(error);
    }
}
const reviewConnectionRequest = async function (req, res, next) {
    try {
        const loggedInUser = req.user;
        const loggedInUserId = loggedInUser._id;
        const { status, requestId } = req.params;
        /**
         * validate status and requestId
            
         */
        if (!validator.isMongoId(requestId)) {
            throw new AppError("Invalid Request ID!!", StatusCodes.BAD_REQUEST)
        }
        const allowedStatusValues = ["accepted", "rejected"];
        if (!allowedStatusValues.includes(status)) {
            throw new AppError(`Invalid status value. Only 'accepted' and 'rejected' are allowed.`, StatusCodes.BAD_REQUEST);
        }

        const reviewedRequest = await connectionRequestService.reviewRequest(loggedInUserId,requestId,status)

        return res.status(StatusCodes.OK).json({
            success: true,
            message:`Connection request ${status} successfully!` ,
            data: reviewedRequest,
            error: null
        });

    } catch (error) {
        next(error)
    }
}

module.exports = {
    sendConnectionRequest,
    reviewConnectionRequest
}