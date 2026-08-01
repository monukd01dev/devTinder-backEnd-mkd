const { StatusCodes, ReasonPhrases } = require("http-status-codes")
const { AppError } = require("../utils/customErrors")
const { validateEditProfileData, validateUpdatePassword } = require("../utils/validators")
const ProfileService = require("../services/profile.service")

const updateProfile = async function (req, res, next) {
    try {
        const loggedInUser = req.user;
        const { emailId, password, ...safeFields } = req.body;

        // Controller checks if the user sent an empty request body
        if (Object.keys(safeFields).length === 0) {
            throw new AppError("No data provided in request body to update", StatusCodes.BAD_REQUEST);
        }

        const cleanUpdates = validateEditProfileData(safeFields);

        // Controller checks if AFTER validation, we are left with nothing
        if (Object.keys(cleanUpdates).length === 0) {
             throw new AppError("No valid allowed fields provided to update", StatusCodes.BAD_REQUEST);
        }

        const savedUser = await ProfileService.updateUser(cleanUpdates, loggedInUser);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Update successful!!',
            data: savedUser,
            error: null
        });

    } catch (error) {
        next(error);
    }
}

const updateUserPassword = async function (req, res, next) {
    try {
        const loggedInUser = req.user;
        
        // 1. Data ko extract aur format validate karo
        const { newPassword, currentPassword } = validateUpdatePassword(req.body); 
        
        // 2. Saara heavy-lifting Service ko pass kardo! Controller doesn't care HOW it happens.
        await ProfileService.updatePassword(loggedInUser, currentPassword, newPassword);

        // 3. Success Response & Session Invalidation (Logout)
        return res.clearCookie('token', { expires: new Date() })
            .status(StatusCodes.OK)
            .json({
                success: true,
                message: "Password updated successfully. Please login with your new password.",
                data: null,
                error: null
            });
            
    } catch (error) {
        next(error);
    }
};

const getProfile = function (req, res, next) {
    try {

        const loggedInUser = req.user;
        return res.status(StatusCodes.OK).json({
            success: true,
            message: ReasonPhrases.OK,
            data: loggedInUser,
            error: null
        })

    } catch (error) {
        next(error)
    }
}

const deleteProfile = async function (req, res, next) {
    try {
        const loggedInUser = req.user;
        const deletedUser = await ProfileService.deleteUser(loggedInUser)

        res.clearCookie("token")
        return res.status(StatusCodes.OK).json({
            success: true,
            message: ReasonPhrases.OK,
            data: deletedUser,
            error: null
        })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    updateProfile,
    getProfile,
    deleteProfile,
    updateUserPassword
}