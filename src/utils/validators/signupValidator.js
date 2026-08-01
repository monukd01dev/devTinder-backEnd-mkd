const { StatusCodes } = require('http-status-codes');
const { AppError } = require('../customErrors');
const validator = require('validator');

const signupValidator = (body) => {
    // 1. Pehle sirf raw data extract kar (bina kisi function ke)
    const { firstName, lastName, gender, about, emailId, photoUrl, age, password, skills } = body;

    const cleanUpdates = {};

    // --- REQUIRED STRING FIELDS ---

    // firstName
    if (!firstName || typeof firstName !== 'string') {
        throw new AppError("First Name is required and must be text!",StatusCodes.BAD_REQUEST);
    }
    const fn = firstName.trim();
    if (fn.length < 2 || fn.length > 50 || !validator.isAlpha(fn, 'en-US', { ignore: ' ' })) {
        throw new AppError("Invalid First Name",StatusCodes.BAD_REQUEST);
    }
    cleanUpdates.firstName = fn;

    // emailId
    if (!emailId || typeof emailId !== 'string') {
        throw new AppError('Email is required and must be text!',StatusCodes.BAD_REQUEST);
    }
    const eid = emailId.trim();
    if (eid.length > 100 || !validator.isEmail(eid)) {
        throw new AppError("Invalid Email!",StatusCodes.BAD_REQUEST);
    }
    cleanUpdates.emailId = eid;

    // password (ise trim nahi karte)
    if (!password || typeof password !== 'string') {
        throw new AppError("Password is required and must be text!",StatusCodes.BAD_REQUEST);
    }
    if (!validator.isStrongPassword(password)) {
        throw new AppError('Weak Password!',StatusCodes.BAD_REQUEST);
    }
    cleanUpdates.password = password;

    // gender
    if (!gender || typeof gender !== 'string') {
        throw new AppError("Gender is required and must be text!",StatusCodes.BAD_REQUEST);
    }
    const g = gender.trim().toLowerCase();
    const allowedGenders = ['male', 'female', 'others'];
    if (!allowedGenders.includes(g)) {
        throw new AppError("Gender must be male, female, or other.",StatusCodes.BAD_REQUEST);
    }
    cleanUpdates.gender = g;


    // --- REQUIRED NUMBER FIELD ---

    // age
    if (age === undefined || age === null || age === '') {
        throw new AppError("Age is required!",StatusCodes.BAD_REQUEST);
    }
    const parsedAge = Number(age);
    if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 100) {
        throw new AppError("Age must be a valid number between 18 and 100.",StatusCodes.BAD_REQUEST);
    }
    cleanUpdates.age = parsedAge;


    // --- OPTIONAL FIELDS (Pehle existence check, phir type check) ---

    // lastName
    if (lastName !== undefined) {
        if (typeof lastName !== 'string') throw new AppError("Last Name must be text.",StatusCodes.BAD_REQUEST);
        const ln = lastName.trim();
        if (ln.length > 50 || (lastName.length > 0 && !validator.isAlpha(lastName, 'en-US', { ignore: ' ' }))) {
            throw new AppError("Invalid Last Name",StatusCodes.BAD_REQUEST);
        }
        cleanUpdates.lastName = ln;
    }
    //about
    if (about !== undefined) {
        if (typeof about !== 'string') throw new AppError("About must be text.", StatusCodes.BAD_REQUEST);
        const ab = about.trim();
        if (ab.length > 500) throw new AppError('About section cannot exceed 500 characters.', StatusCodes.BAD_REQUEST);
        
        // Asli fix: Bina escape kiye raw text save kar
        cleanUpdates.about = ab; 
    }
    // photoUrl
    if (photoUrl !== undefined) {
        if (typeof photoUrl !== 'string') throw new AppError("Photo URL must be text.",StatusCodes.BAD_REQUEST);
        const pu = photoUrl.trim();
        if (pu.length > 1000 || (photoUrl.length > 0 && !validator.isURL(photoUrl, { require_protocol: true }))) {
            throw new AppError('Invalid Photo URL',StatusCodes.BAD_REQUEST);
        }
        cleanUpdates.photoUrl = pu;
    }

    // skills
    if (skills !== undefined) {
        if (!Array.isArray(skills)) throw new AppError("Skills must be an array.",StatusCodes.BAD_REQUEST);
        if (skills.length > 15 || !skills.every(e => typeof e === 'string' && e.length <= 30)) {
            throw new AppError('Skill array is invalid or too big!',StatusCodes.BAD_REQUEST);
        }
        cleanUpdates.skills = skills;
    }

    // 2. Return strictly constructed object
    return cleanUpdates;
};

module.exports = signupValidator;