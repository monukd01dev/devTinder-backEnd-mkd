const { StatusCodes, ReasonPhrases } = require("http-status-codes")
const UserService = require("../services/user.service")

const userFeed = async function (req, res, next) {
    try {
        const loggedInUser = req.user;
        const page = req.query?.page;
        const limit = req.query?.limit;

        const feed = await UserService.getFeed(loggedInUser,page,limit)
        return res.status(StatusCodes.OK).json({
            success: true,
            message: ReasonPhrases.OK,
            data: {
                "totalUsers": feed.length,
                "feed": feed
            },
            error: null
        })
    } catch (error) {

        next(error)
    }
}

const getConnections = async function (req, res, next) {
    try {
        const loggedInUser = req.user

        const connections = await UserService.userConnections(loggedInUser._id)

        return res.status(StatusCodes.OK).json({
            success: true,
            message: connections.length === 0 ? "No connections yet keep hustling!!" : ReasonPhrases.OK,
            data: {
                totalConnections: connections.length,
                connections
            },
            error: null
        })
    } catch (error) {
        next(error)
    }
}

const getReceivedRequests = async function (req, res, next) {
    try {
        const loggedInUser = req.user;
        const data = await UserService.receivedRequests(loggedInUser._id)
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Recieved requests fetched successfully",
            data,
            error: null
        })
    } catch (error) {
        next(error)
    }

}


module.exports = {
    userFeed,
    getConnections,
    getReceivedRequests
}