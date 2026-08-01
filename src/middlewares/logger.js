const globalLogger = (req, res, next) => {
    // 1. ignore the /favicon.ico req
    if (req.url === '/favicon.ico') return next();

    // 2. Stopwatch start karo jab request aayi
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    // 3. Express ka Magic: 'res.on("finish")'
    // Hum log turant print nahi karenge. Hum wait karenge ki server apna kaam khatam karke response bhej de.
    res.on('finish', () => {
        // 4. Stopwatch roko aur time calculate karo
        const duration = Date.now() - startTime;
        
        // 5. Professional Format me Print karo
        // Format: [TIMESTAMP] METHOD URL | Status: 200 | Time: 15ms
        console.log(`[INFO] [${timestamp}] ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | Time: ${duration}ms`);
    });

    // Request ko aage controller tak bhej do
    next();
};

module.exports = { globalLogger };