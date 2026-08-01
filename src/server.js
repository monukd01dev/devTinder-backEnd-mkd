require('dotenv').config();
const app = require('./app'); // Express app import kiya
const { dbConnect } = require('./config'); // Database import kiya
const dns = require('dns')
const PORT = process.env.PORT || 3000;

dns.setServers([
    '1.1.1.1',
    '8.8.8.8'
])

async function startServer() {
    try {
        // 1. Pehle database connect karo
        await dbConnect(); 
        console.log(`[INFO] [${new Date().toISOString()}] 🟢 Database connection successful.`);

        // 2. Phir server start karo
        app.listen(PORT, () => {
            console.log(`[INFO] [${new Date().toISOString()}] 🚀 Server is running on PORT ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
        });
    } catch (error) {
        // 3. Pro Error Logging
        console.error(`[FATAL] [${new Date().toISOString()}] ❌ Server startup aborted due to database failure.`);
        console.error(error); // Taaki backend engineer ko actual Mongoose error dikhe

        // 4. Kill the process! (Sabse Zaroori Step)
        process.exit(1); 
    }
}

startServer();