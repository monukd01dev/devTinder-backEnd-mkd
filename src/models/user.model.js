const { Schema, model } = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const ConnectionRequest = require('./connectionRequest.model');

const userSchema = new Schema({
    'firstName': {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 50,
        trim: true,
        validate(value) {
            if (!validator.isAlpha(value, 'en-US', { ignore: ' ' })) {
                throw new Error('First Name must only contain alphabets.')
            }
        }
    },
    'lastName': {
        type: String,
        maxLength: 50,
        trim: true,
        validate(value) {
            if (!value) return //varna "lastName" : "" , pe ye validation chala deta hai not required me ye sirf "lastName" : undefined he mangta hai 
            if (!validator.isAlpha(value, 'en-US', { ignore: ' ' })) {
                throw new Error('Last Name must only contain alphabets.')
            }
        }
    },
    'emailId': {
        type: String,
        index : true,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        maxLength: 100,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Provide a valid email address.')
            }
        }

    },
    'password': {
        type: String,
        trim: true,
        required: true,
        //we cannot put the maxLength check here cause we are using password hashing
        //password ki maxLength API-level par 50-64 limit kar (Bcrypt ko crash hone se bachane ke liye).
        validate(value) {
            if (!validator.isStrongPassword(value)) {
                throw new Error("Password is too weak.")
            }
        }

    },
    'age': {
        type: Number,
        min: [18, "You Must be 18+ to use this app cause some devs do penetration testing too."],
        max: [120, "Age cannot exceed 120 years."]

    },
    'gender': {
        type: String,
        required: true,
        lowercase: true,
        enum: {
            values: ['male', 'female', 'others'],
            // message: `{value} not allowed only male, female and others` value uppercase me likhna hota hai 
            message: `{VALUE} not allowed only male, female and others are allowed.`
        }
    }
    , 'photoUrl': {
        type: String,
        trim: true,
        default: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png',
        // photoUrl ki maxLength Schema-level par 500-1000 limit kar (Storage abuse rokne ke liye).
        maxLength: 1000,
        validate(value) {
            if (value && !validator.isURL(value, { require_protocol: true })) {
                throw new Error('Invalid Photo URL. Must include http/https.')
            }
        }
    },
    'skills': {
        type: [String],
        validate: {
            validator: function (arr) {
                // Array length check (max 15 skills)
                if (arr.length > 15) return false;
                // String length check inside array (max 30 chars per skill)
                return arr.every(s => s.length <= 30);
            },
            message: 'Skills array cannot exceed 15 items, and each skill must be under 30 characters.'
        }
    },
    'about': {
        type: String,
        trim: true,
        default : 'The Engineer you always wanted',
        maxLength: [2000, 'About is too big.'] // Prevent DB DoS
    }

}, {
    timestamps: true
})

//! compound indexing
userSchema.index({firstName: 1, lastName : 1})

//! Schema Methods
userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();
    const { password,__v, ...safeObject } = userObject; //instead of using the delete userObject.password I am using destructuring
    return safeObject
}
userSchema.methods.getJwtToken = async function(){
    const user = this;
    const token = await jwt.sign({"_id" : user._id},process.env.JWT_TOKEN_KEY,{"expiresIn" : process.env.JWT_TOKEN_EXPIRY_TIME})
    return token;
}

userSchema.methods.isPasswordMatch = async function(userGivenPassword){
    const user = this;
    const userPasswordHash = user.password; 
    const isMatched = await bcrypt.compare(userGivenPassword.trim(),userPasswordHash)
    return isMatched
}

//don not use arrow function here you know why
userSchema.pre('save', async function () {
    const user = this;
    //very important step
    if (!user.isModified('password')) return

    const newHashString = await bcrypt.hash(user.password, 12);

    user.password = newHashString;

})
// delete direct auth se aaye hue document pe chala raha hune isliye yaha document true aur query false ye nhi karunga to this._id undefined aaega kyonki fir vo query ko point karega document ke bajae
userSchema.pre('deleteOne',{document:true,query:false}, async function(){
    const userId = this._id;

    //jaha jaha is user ka reference hai use delete kardo agar char collections me hai to unhe delete krdo 
    //abhi sirf ConnectionRequest collection me he hai 
    await ConnectionRequest.deleteMany({
        $or : [
            {fromUserId : userId},
            {toUserId : userId}
        ]
    })
})

const User = model('User', userSchema);
module.exports = User;