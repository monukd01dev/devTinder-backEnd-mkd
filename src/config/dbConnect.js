const mongoose = require('mongoose');

const dbConnect = async function () {
    // Yahan seedha promise return kar do. 
    // Agar pass hua toh server.js ka 'try' chalega, fail hua toh usika 'catch' chalega.
    return mongoose.connect(process.env.DB_CONNECTION_STRING);
};

module.exports =  dbConnect ;