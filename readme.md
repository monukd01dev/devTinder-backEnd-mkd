# devTinder Backend 🚀

[![Node.js](https://img.shields.io/badge/Node.js-v26.2.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v5.0.0--beta-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v8.0-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Mongoose](https://img.shields.io/badge/Mongoose-v9.0-880000?logo=mongoose&logoColor=white)](https://mongoosejs.com/)
[![Security](https://img.shields.io/badge/Security-OWASP_Top_10-blue)](https://owasp.org/www-project-top-ten/)
[![Code Style](https://img.shields.io/badge/Code_Style-ESLint-4B32C3?logo=eslint&logoColor=white)](https://eslint.org/)

A production-grade, highly secure, and optimized MERN-stack backend service designed for developer networking. This platform facilitates professional matching, pair-programming collaborations, and network building among engineers. It represents a strict rejection of amateur "spaghetti code" in favor of enterprise design patterns, modular architecture, and extreme defensive programming.

---

## 🧠 My Engineering Philosophy

I believe that **clean code is a byproduct of meticulous system design, not an accident**. 

An amateur starts typing code immediately; an engineer spends hours brainstorming, wireframing, and refining the architecture before writing a single line of code. For this repository:
1. **Measure Twice, Cut Once**: Every database schema, route prefix, and middleware bouncer was thoroughly mapped out and simulated.
2. **Defensive by Default**: Trust nothing coming from the client. Every incoming payload, query parameter, and cookie is sanitized, type-checked, and validated at the edge.
3. **Decoupled Architecture**: Systems must have high cohesion and low coupling. Services contain pure business logic and are completely HTTP-agnostic, while Controllers serve strictly as traffic managers.

---

## 🏗️ Architectural Deep Dive

### 1. Modular Layered Design (SoC)
Rather than cluttering the codebase with monolithic route files, this service implements a strict **Controller-Service-Model** pattern. This structure ensures that database operations, business validation, and HTTP routing never bleed into one another.

```
src/
├── config/             # Database connection configurations
├── routes/             # Express.js route layers mapped to controllers
├── controllers/        # Request/Response orchestration (HTTP-specific)
├── services/           # Decoupled business logic & DB operations
├── models/             # Mongoose schemas & schema methods
├── middlewares/        # Authentication, Logger, & Global Error Handlers
└── utils/              # Custom exceptions and field validators
```

### 2. "Database First, Server Second" Boot Sequence
To prevent a common production failure where a Node server starts listening before the database is ready (resulting in unhandled connection errors), the application enforces a strict boot flow.
```javascript
// server.js
const startServer = async () => {
    try {
        await dbConnect(); // Resolves connection promise first
        console.log("[INFO] Database connection established.");
        app.listen(PORT, () => {
            console.log(`[INFO] Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("[FATAL] Server startup aborted due to DB failure.");
        process.exit(1); // Safely kill container to trigger auto-restart in orchestration
    }
};
```

### 3. Cascading Database Cleanups (No Orphan Records)
To guarantee data integrity and prevent dangling references when a user deletes their profile, Mongoose lifecycle middleware is utilized to perform atomic cascading deletions of associated network relationships.
```javascript
// user.model.js
userSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    const ConnectionRequest = mongoose.model('ConnectionRequest');
    // Atomically purge all pending or accepted requests involving this user
    await ConnectionRequest.deleteMany({
        $or: [
            { fromUserId: this._id },
            { toUserId: this._id }
        ]
    });
    next();
});
```

### 4. Non-Relational "Anti-Join" Feed Generation
Dating/matching feeds require complex exclusions: a user should never see themselves, their active connections, or individuals they have already swiped left/right on. To avoid computationally expensive `$lookup` (JOIN) operations in NoSQL, we implement an optimized two-step **App-Level Join**:
1. Retrieve all interaction history for the logged-in user in a single indexed query.
2. Extract the IDs, append the current user's ID, and perform a `$nin` (Not In) query on the `User` collection.
```javascript
// user.service.js
const getFeed = async (loggedInUser, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    
    // Step 1: Find all interaction records
    const connections = await ConnectionRequest.find({
        $or: [{ toUserId: loggedInUser._id }, { fromUserId: loggedInUser._id }]
    }).select('toUserId fromUserId');

    // Step 2: Build an explicit blacklist
    const blacklist = connections.map(conn => 
        conn.toUserId.equals(loggedInUser._id) ? conn.fromUserId : conn.toUserId
    );
    blacklist.push(loggedInUser._id); // Avoid "self-love" bug

    // Step 3: Fetch paginated, clean user profiles
    return await User.find({ _id: { $nin: blacklist } })
        .select('_id firstName lastName age gender photoUrl about skills')
        .skip(skip)
        .limit(limit);
};
```

### 5. Mass Assignment Prevention & Type-Safe Sanitization
To block **Over-Posting/Mass Assignment** vulnerabilities (e.g., an attacker injecting `role: 'admin'` or `isEmailVerified: true` into a profile update payload), the API implements a strict whitelisting layer. Moreover, it employs extensive `typeof` guards to protect against null-injection and crashes on optional parameters.
```javascript
// validateEditProfileData.js
const validateEditProfileData = (body) => {
    const ALLOWED_UPDATES = ["firstName", "lastName", "age", "gender", "photoUrl", "about", "skills"];
    const incomingFields = Object.keys(body);
    
    const isEditAllowed = incomingFields.every(field => ALLOWED_UPDATES.includes(field));
    if (!isEditAllowed) {
        throw new AppError("Payload contains restricted fields.", StatusCodes.BAD_REQUEST);
    }

    const cleanUpdates = {};
    if (body.firstName !== undefined) {
        if (typeof body.firstName !== 'string') throw new AppError("Invalid firstName type", 400);
        cleanUpdates.firstName = body.firstName.trim();
    }
    // Repeating secure checks for other fields to prevent unhandled TypeErrors...
    return cleanUpdates;
};
```

### 6. Bulletproof Serialization & State-Safe Hashing
We keep the database as the **Single Source of Truth** for security.
* **Bcrypt with `isModified` guards**: Password hashing is delegated to the database model's `pre('save')` lifecycle hook, using a high cost factor of 12 rounds. It checks `isModified('password')` to avoid double-hashing on non-password profile edits.
* **Overriding `toJSON`**: To prevent accidental data leaks (e.g., returning password hashes or internal Mongoose version keys to the frontend), the schema's `toJSON` method is overridden to cleanly strip out sensitive fields during serialization using ES6 destructuring.
```javascript
// user.model.js
userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    const { password, __v, ...safeObject } = userObject;
    return safeObject;
};
```

### 7. Centralized Error Airbag & Latency Logging
We implemented a custom global error handling middleware and customized logger:
* **Centralized Error Handler**: Controllers simply catch errors and pass them via `next(error)`. The global handler dynamically intercepts errors, formats Mongoose-specific constraints (e.g., Error 11000 for duplicate emails), and sends standard corporate JSON responses.
* **Environment-Aware Leak Protection**: Error stack traces are conditionally rendered based on `process.env.NODE_ENV`—fully visible in development but strictly hidden in production.
* **Response Latency Tracker**: Our custom logger listens to Express's `res.on('finish')` event to measure precise request-response cycles, identifying API latency bottlenecks.

---

## 🌟 Features

* **JWT Session Management**: Secure stateless authentication using JSON Web Tokens stored in signed, HttpOnly cookies.
* **Defensive Edge Validation**: Built-in regex format validation, array constraints, type boundaries, and custom validators.
* **Smart Matching & Swiping Engine**: Bulletproof left/right-swiping backend logic managing "interested", "ignored", "accepted", and "rejected" states.
* **Optimistic UI Support**: Endpoints designed for instantaneous frontend updates with reliable server rollback handlers.
* **Secure Profile Updates**: Strict patch whitelisting protecting critical account fields.
* **Server Health Monitoring**: Standardized `/health` endpoint returning server uptime, environment variables, and UTC timestamps for load-balancer polling.
* **DOS Protection**: Strict rate-limiting on API endpoints via `express-rate-limit` coupled with HTTP security header masking using `helmet`.

---

## 🛠️ Tech Stack

* **Runtime Environment**: Node.js (v26.2.0)
* **API Framework**: Express.js (v5.0.0-beta)
* **ODM Layer**: Mongoose (v9.0)
* **Database Engine**: MongoDB Atlas (Cloud NoSQL)
* **Cryptography**: Bcrypt
* **Session Handler**: JsonWebToken (JWT) & Cookie-Parser
* **Quality Assurance & Styling**: ESLint (Flat Config)

---

## ⚙️ Setup and Installation

Follow these steps to spin up the service locally:

### Prerequisite
* Node.js (v26.2.0 or higher recommended)
* MongoDB (Local instance or Cloud Atlas URI)

### 1. Clone and Install Dependencies
```bash
git clone https://github.com/your-username/devTinder-backend-mkd.git
cd devTinder-backend-mkd
npm install
```

### 2. Configure Environment Variables
Create a `.env` file at the root of the project:
```env
PORT=8080
DB_CONNECTION_STRING=mongodb+srv://<username>:<password>@cluster.mongodb.net/devTinder
JWT_TOKEN_KEY=your_super_secret_jwt_key_here
JWT_TOKEN_EXPIRY_TIME=1d
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Run the Server
For development (with hot-reloading):
```bash
npm run dev
```

For production (using PM2 process orchestration):
```bash
npm install -g pm2
pm2 start src/server.js --name "devtinder-api"
```

### 4. API Testing
Use the `/health` endpoint to verify the server status:
```bash
curl http://localhost:8080/api/v1/health
```
