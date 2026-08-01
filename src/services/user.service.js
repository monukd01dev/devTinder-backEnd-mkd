const { User, ConnectionRequest } = require("../models")

const getFeed = async function (loggedInUser, reqPage = 1, reqLimit = 10) {

    const { _id: loggedInUserId } = loggedInUser;

    let page = parseInt(reqPage) || 1;
    let limit = parseInt(reqLimit) || 10;

    limit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;

    //Unoptimised query 
    // const userAllConnections = await ConnectionRequest.find({ $or: [{ "toUserId": loggedInUserId }, { "fromUserId": loggedInUserId }] })
    // optimised query
    const userAllConnections = await ConnectionRequest.find({ $or: [{ "toUserId": loggedInUserId }, { "fromUserId": loggedInUserId }] }).select('toUserId fromUserId')

    //array is the best approach here cause look at the filtering you don't even need set easy simple and redable while sets require lots of conversions
    const alreadyHaveConnectionsWith = userAllConnections.map(user => user.toUserId.equals(loggedInUserId) ? user.fromUserId : user.toUserId)

    // also removing the loggedIn user so it will not create selflove bug
    alreadyHaveConnectionsWith.push(loggedInUserId)

    //! if i have userd sets (unOptimized way)
    //the set implementation will already handle the selfLove bug cause in every iteration I am entering the loggedInUserId through toUserId(in case i got the request) fromUserId(in case i send the request)
    // const blockedUser = new Sets()
    // userAllConnections.forEach(connection =>{
    //     // error statements cause we are storing the objects(BSON Obj ID) not the id String so we have to convert it
    //     // blockedUser.add(connection.toUserId);
    //     // blockedUser.add(connection.fromUserId);
    //     blockedUser.add(connection.toUserId.toString());
    //     blockedUser.add(connection.fromUserId.toString());
    // })
    //! sets implementation ended

    const feed =
        await User
            .find({ "_id": { $nin: alreadyHaveConnectionsWith } })
            // .find({ "_id": { $nin: Array.from(blockedUser) } })set unOptimized way
            .select("_id firstName lastName age gender photoUrl about skills")
            .skip(skip)
            .limit(limit)

    return feed
}

const userConnections = async function (loggedInUserId) {
    const connections = await ConnectionRequest.find({
        $or: [
            { toUserId: loggedInUserId, status: 'accepted' },
            { fromUserId: loggedInUserId, status: 'accepted' }
        ]
    })
        .populate("fromUserId", "firstName lastName photoUrl age gender about")
        .populate("toUserId", "firstName lastName photoUrl age gender about");

    const data = connections.map(({ fromUserId, toUserId }) => {
        //A check for null and OrphanRecords
        if (!fromUserId || !toUserId) return null

        if (fromUserId._id.equals(loggedInUserId))
            return toUserId

        return fromUserId
    }).filter(user => user !== null) //here are cleaning the null records

    return data;
}

const receivedRequests = async function (loggedInUserId) {
    const data = await ConnectionRequest.find({
        toUserId: loggedInUserId,
        status: "interested"
    })
    .select('-toUserId -createdAt -updatedAt -__v ')
    .populate("fromUserId", "firstName lastName photoUrl age gender about") //we cannot attach .filter here cause it return the query object find method chain ke start me hai .populate end me hai jab tak vo array se query object ho chuka hai // array vo await ke baad me banega

    const cleanData = data.filter(user => user !== null)

    return cleanData
}

module.exports = {
    getFeed,
    userConnections,
    receivedRequests,
}