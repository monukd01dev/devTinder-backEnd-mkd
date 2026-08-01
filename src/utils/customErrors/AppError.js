class AppError extends Error {
    constructor(message,statusCode){
        super(message)
        this.statusCode = statusCode
        this.isOperational = true; // Taaki global handler ko pata rahe yeh humne throw kiya hai
        Error.captureStackTrace(this,this.constructor)
    }
}

module.exports = AppError