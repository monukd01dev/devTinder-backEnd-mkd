require('dotenv').config()
const mongoose = require('mongoose');
const seedConnections = require('./runners/seedConnections')
const seedUsers = require('./runners/seedUsers')
const {dbConnect} = require('../config');
const { db } = require('../models/connectionRequest.model');
const runAllSeeds = async function () {
    try {
        console.log(`[Seeding devTinder Started 🌱]`)
        console.log("----------------------------------------------------------------------------")
        // task-1 connecting to database
        console.log(`[Seeding devTinder] Connecting to devTinder cluster`)
        await dbConnect()
        console.log(`[Seeding devTinder] Connected to devTinder cluster successfully ✅`)
        console.log("----------------------------------------------------------------------------")
        await seedConnections()
        console.log("----------------------------------------------------------------------------")
        await seedUsers()
        console.log("----------------------------------------------------------------------------")
        console.log(`[Seeding devTinder finished 🌱]`)
    } catch (error) {
        console.error(`[Seeding devTinder] : Failed ❌`, error)
    }finally{
        mongoose.disconnect();
        process.exit(0)

    }
}

runAllSeeds()