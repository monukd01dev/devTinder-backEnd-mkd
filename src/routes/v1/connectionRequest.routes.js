const express = require('express')
const connectionRequestRouter = express.Router()
const connectionRequestController = require('../../controllers/connectionRequest.controller')
connectionRequestRouter.post('/send/:status/:toUserId',connectionRequestController.sendConnectionRequest)
connectionRequestRouter.patch('/review/:status/:requestId',connectionRequestController.reviewConnectionRequest)

module.exports = connectionRequestRouter