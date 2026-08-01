const loginValidator = require("./loginValidator");
const signupValidator = require("./signupValidator");
const validateEditProfileData = require("./validateEditProfileData");
const validateUpdatePassword = require("./validateUpdatePassword");

module.exports = {
    signupValidator,
    validateEditProfileData,
    loginValidator,
    validateUpdatePassword
}