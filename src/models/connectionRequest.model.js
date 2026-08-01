const { Schema, model } = require('mongoose');


const connectionRequestSchema = new Schema({
    "toUserId": {
        type: Schema.Types.ObjectId, // Fixed: removed 'mongoose.'
        required: true,
        ref: "User", // 👈  Tells Mongoose this ID belongs to the User collection
    },
    "fromUserId": {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    "status": {
        type: String,
        required: true,
        enum: {
            values: ["accepted", "rejected", "ignored", "interested"],
            message: `{VALUE} is not supported. Only accepted, rejected, ignored, and interested are allowed.`
        }
    }
}, { timestamps: true });

// Pre-save hook
connectionRequestSchema.pre('save', function () {
    const connectDetails = this;

    if (connectDetails.fromUserId.equals(connectDetails.toUserId)) {
        throw new Error("You cannot send a connection request to yourself");
    }
});

// Compound Index for lightning-fast queries
connectionRequestSchema.index({ fromUserId: 1, toUserId: 1 });

const ConnectionRequest = model('ConnectionRequest', connectionRequestSchema);
module.exports = ConnectionRequest;