const { StatusCodes } = require('http-status-codes');
const { AppError } = require('../customErrors');
const validator = require('validator');

// 💡 HELPER FUNCTION: String check aur trim ek jagah
const getSanitizedString = (value, fieldName) => {
    if (typeof value !== 'string') {
        throw new AppError(`${fieldName} must be text.`,StatusCodes.BAD_REQUEST);
    }
    return value.trim();
};

const validateEditProfileData = (safefields) => {
    const ALLOWED_UPDATES = ["firstName", "lastName", "age", "gender", "photoUrl", "about", "skills"];
    const incomingFields = Object.keys(safefields);

    const isEditAllowed = incomingFields.every((field) => ALLOWED_UPDATES.includes(field));
    if (!isEditAllowed) {
        throw new AppError("Invalid edit request. Unapproved fields detected!",StatusCodes.BAD_REQUEST);
    }

    const cleanUpdates = {};

    // --- REFACTORED CONDITIONAL VALIDATION ---

    if (safefields.firstName !== undefined) {
        const fn = getSanitizedString(safefields.firstName, "First Name");
        if (fn.length < 2 || fn.length > 50 || !validator.isAlpha(fn, 'en-US', { ignore: ' ' }))
            throw new AppError("Invalid First Name",StatusCodes.BAD_REQUEST);
        cleanUpdates.firstName = fn;
    }

    if (safefields.lastName !== undefined) {
        const lastName = getSanitizedString(safefields.lastName, "Last Name");
        // 🚨 Yahan condition update hui hai
        if (lastName.length > 50 || (lastName.length > 0 && !validator.isAlpha(lastName, 'en-US', { ignore: ' ' }))) {
            throw new AppError("Invalid Last Name",StatusCodes.BAD_REQUEST);
        }
        cleanUpdates.lastName = lastName;
    }

    if (safefields.about !== undefined) {
        const ab = getSanitizedString(safefields.about, "About section");
        if (ab.length > 500) throw new AppError('About section cannot exceed 500 characters.',StatusCodes.BAD_REQUEST);
        cleanUpdates.about = validator.escape(ab); 
    }

    if (safefields.gender !== undefined) {
        const gender = getSanitizedString(safefields.gender, "Gender").toLowerCase();
        const allowedGenders = ['male', 'female', 'others'];
        if (!allowedGenders.includes(gender)) {
            throw new AppError("Gender must be male, female, or other.",StatusCodes.BAD_REQUEST);
        }
        cleanUpdates.gender = gender;
    }

    if (safefields.photoUrl !== undefined) {
        const photoUrl = getSanitizedString(safefields.photoUrl, "Photo URL");
        // 🚨 Yahan condition update hui hai
        if (photoUrl.length > 1000 || (photoUrl.length > 0 && !validator.isURL(photoUrl, { require_protocol: true }))) {
            throw new AppError('Invalid Photo URL',StatusCodes.BAD_REQUEST);
        }
        cleanUpdates.photoUrl = photoUrl;
    }

    if (safefields.age !== undefined) {
        const parsedAge = Number(safefields.age);
        if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 100)
            throw new AppError("Age must be a valid number between 18 and 100.",StatusCodes.BAD_REQUEST);
        cleanUpdates.age = parsedAge;
    }

    if (safefields.skills !== undefined) {
        const skills = safefields.skills;
        if (!Array.isArray(skills)) throw new AppError("Skills must be an array.",StatusCodes.BAD_REQUEST);
        if (skills.length > 15 || !skills.every(e => typeof e === 'string' && e.length <= 30)) {
            throw new AppError('Skill array is invalid or too big!',StatusCodes.BAD_REQUEST);
        }
        cleanUpdates.skills = skills;
    }

    return cleanUpdates;
};

module.exports = validateEditProfileData;