// 404 Not Found Handler (Strict & Professional)
const notFoundHandler = (req, res, next) => {
    return res.status(404).json({
        success: false,
        message: `The requested endpoint '${req.originalUrl}' does not exist on this server.`,
        error: "Not Found"
    });
};

// The Ultimate Global Error Handler (Handles Mongoose magically)
const globalErrorHandler = (err, req, res, next) => {
    
    // Default values for standard errors
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // 🚀 MAGIC: Automatically catch Mongoose Database Errors globally!
    // 1. Mongoose Validation Error (Maan le user ne galat email format bheja)
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = "Invalid input data. Please verify your fields.";
    } 
    // 2. Mongoose Duplicate Key Error (Maan le kisi ne already registered email daal diya)
    else if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue)[0];
        message = `An account with that ${field} already exists.`;
    } 
    // 3. Mongoose CastError (Maan le kisine MongoDB ki _id galat format me bheji)
    else if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid format for ${err.path}.`;
    }

    // 🚨 Log critical 500 errors to terminal, but ignore 400s (Client mistakes)
    if (statusCode === 500) {
        console.error(`[CRITICAL SERVER ERROR] : `, err);
    }

    // Send the clean corporate response
    return res.status(statusCode).json({
        success: false,
        message: statusCode === 500 ? "An unexpected error occurred on the server." : message,
        // Send stack trace ONLY if we are in development mode
        error: process.env.NODE_ENV === 'development' ? err.stack : null
    });
};

module.exports = {
    notFoundHandler,
    globalErrorHandler
};