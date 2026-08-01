const { StatusCodes } = require("http-status-codes");
const { AppError } = require("../customErrors");
const validator = require("validator"); // Assuming you have this imported

const loginValidator = function (loginInfo) {

    if (!loginInfo || typeof loginInfo !== 'object' || Array.isArray(loginInfo)) {
        throw new AppError("Invalid request payload! Expected a JSON object.",StatusCodes.BAD_REQUEST);
    }

    const { emailId, password } = loginInfo;

    // 1. Email Validation (Saari conditions ek hi IF block me merge kar di)
    if (
        !emailId ||
        typeof emailId !== 'string' ||
        emailId.trim().length > 100 ||
        !validator.isEmail(emailId.trim())
    ) {
        throw new AppError('Invalid emailId format', StatusCodes.BAD_REQUEST);
    }

    // 2. Password Validation (Saari conditions ek hi IF block me merge kar di)
    if (
        !password ||
        typeof password !== 'string' ||
        !validator.isStrongPassword(password.trim())
    ) {
        throw new AppError('Invalid password format', StatusCodes.BAD_REQUEST);
    }

    // 3. Return the sanitized data
    return {
        emailId: emailId.trim(),
        password: password.trim()
    };
};

module.exports = loginValidator;