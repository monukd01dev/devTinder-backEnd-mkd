const express = require('express');
const authRouter = require('./auth.routes');
const profileRouter = require('./profile.routes')
const userRouter = require('./user.routes')
const v1Router = express.Router();
const { healthCheck } = require('../../controllers/health.controller');
const { userAuth } = require('../../middlewares/Auth');
const connectionRequestRouter = require('./connectionRequest.routes');

v1Router.use('/health', healthCheck)
v1Router.use('/auth', authRouter)
v1Router.use('/user/profile', userAuth, profileRouter)
v1Router.use('/user', userAuth, userRouter)
v1Router.use('/user/request', userAuth, connectionRequestRouter)

module.exports = v1Router;