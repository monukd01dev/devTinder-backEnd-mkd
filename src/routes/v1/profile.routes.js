const express = require('express')
const profileRouter = express.Router()

const ProfileController = require('../../controllers/profile.controller')
const { userAuth } = require('../../middlewares/Auth')


profileRouter.patch('/edit', ProfileController.updateProfile)
profileRouter.get('/', ProfileController.getProfile)
profileRouter.delete('/', ProfileController.deleteProfile)
profileRouter.patch('/update-password',ProfileController.updateUserPassword)

module.exports = profileRouter;
