const { ConnectionRequest } = require("../../models")

const seedConnections = async function(){

    try {
        console.log(`[Seeding Connections Started 🌱]`)
        await ConnectionRequest.deleteMany({})
        console.log(`[Seeding Connections] Phase : 1 🧹 Cleared existing connections.`)
        console.log(`[Seeding Connections] 🌱 completed successfully ✅`)

    } catch (error) {
        console.error(`[Seeding Connections] : Failed ❌`, error)
    }
}
module.exports = seedConnections