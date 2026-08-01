const validator = require('validator');
const { StatusCodes } = require('http-status-codes');
const { AppError } = require('../customErrors');

const validateUpdatePassword = function(data) {
    const { currentPassword, newPassword } = data;

    // 1. Existence and Type Check (Defensive mechanism)
    if (!currentPassword || !newPassword || typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
        throw new AppError("Both current and new passwords are required and must be text", StatusCodes.BAD_REQUEST);
    }

    // 2. Sanitize (Trim outer spaces)
    const cPass = currentPassword.trim();
    const nPass = newPassword.trim();

    // 3. Format Validation (ONLY on the new password, using the trimmed variable)
    if (!validator.isStrongPassword(nPass)) {
        throw new AppError("New password must be strong (Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol)", StatusCodes.BAD_REQUEST);
    }

    // 4. Logical Check (Preventing same password reuse)
    if (cPass === nPass) {
        throw new AppError("New password cannot be the same as the current password", StatusCodes.BAD_REQUEST);
    }

    // 5. Return Clean Data directly (No need to create an empty object first)
    return {
        currentPassword: cPass,
        newPassword: nPass
    };
};

module.exports = validateUpdatePassword;