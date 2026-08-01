const express = require('express')
const AuthController = require('../../controllers/auth.controller');
const { userAuth } = require('../../middlewares/Auth');


const authRouter = express.Router();

authRouter.post('/signup', AuthController.signup)
authRouter.post('/login', AuthController.login)
authRouter.post('/logout', AuthController.logout)

module.exports = authRouter;