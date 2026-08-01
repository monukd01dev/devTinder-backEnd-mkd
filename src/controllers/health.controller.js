const { StatusCodes } = require("http-status-codes")

const healthCheck = function(req,res){
    const uptime = process.uptime()
    return res.status(StatusCodes.OK).json({
        success : true,
        message : "Server is Up and Running!!",
        data : {
            uptime : `${Math.floor(uptime /60)} minutes`,
            timestamp : new Date().toISOString(),
            environment : process.env.NODE_ENV || 'development'
        },
        error : null
    })

}

module.exports = {
    healthCheck
}