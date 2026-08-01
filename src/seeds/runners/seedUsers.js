const { User } = require('../../models')
const dummyUsers = require('../data/users.data')



const seedUsers = async function () {
    try {

        console.log(`[Seeding User Started 🌱]`)
        const completeUserData = dummyUsers.map(user => {
            return {
                ...user,
                emailId: `${user.firstName.toLocaleLowerCase()}@email.com`,
                password: 'Password@123'
            }
        })
        console.log(`[Seeding User] Phase : 1 Email and Password added successfully!! ✅`)

        await User.deleteMany({});
        console.log(`[Seeding User] Phase : 2 🧹 Cleared existing users.`)

        await User.create(completeUserData);
        console.log(`[Seeding User] Phase : 3 ✅ Users seeded successfully!`);

        console.log(`[Seeding User] 🌱 completed successfully ✅`)
    } catch (error) {
        console.error(`[Seeding User] : Failed ❌`, error)
    }

}

module.exports = seedUsers;