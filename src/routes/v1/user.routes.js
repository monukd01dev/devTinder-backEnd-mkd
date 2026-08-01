const express = require('express');
const UserController = require('../../controllers/user.Controller');
const userRouter = express.Router();

userRouter.get('/feed', UserController.userFeed)
userRouter.get('/connections',UserController.getConnections)
userRouter.get('/requests/received',UserController.getReceivedRequests)


module.exports = userRouter