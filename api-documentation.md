# 🚀 devTinder API Documentation (v2)

Welcome to the **devTinder** production-grade backend API documentation. This system handles developer professional networking, matchmaking, and session management using advanced, secure, and highly optimized MERN architecture.

---

## 📌 Architecture & Design Standards

### 🌐 Base URL
* **Development:** `http://localhost:8080/api/v1`
* **Production:** `https://your-domain.com/api/v1` (or via Azure/GCP public IP `/api/v1` using Nginx reverse proxy)

### 🛡️ Authentication Protocol
Authentication is stateless and handled via **JSON Web Tokens (JWT)**.
* Tokens are stored in the client browser inside secure, **HTTP-only, Signed Cookies** to completely prevent Cross-Site Scripting (XSS) token theft.
* CORS is strictly configured to disallow wildcard (`*`) origins when credentials are included, locking down API access to your explicit frontend domain.
* Protected routes are guarded by the `userAuth` middleware, which is cleanly mounted at the router prefix level within the API gateway routers.

### 🔌 Router Mount Configuration
The `v1Router` organizes endpoints into clear namespaces, placing bouncer guards (`userAuth`) only where authentication is required. This avoids redundant middleware declaration in sub-routers:

```javascript
v1Router.use('/health', healthCheck)
v1Router.use('/auth', authRouter) // ❌ No authentication required for auth routes (Signup, Login, Logout)
v1Router.use('/user/profile', userAuth, profileRouter) // 🔒 Protected Profile operations
v1Router.use('/user', userAuth, userRouter) // 🔒 Protected Feed and Connection listings
v1Router.use('/user/request', userAuth, connectionRequestRouter) // 🔒 Protected Matchmaking actions
```

### 📦 Standardised JSON Wrapper
To ensure predictability and ease of integration for frontend client applications, all successful and failed responses follow the strict **JSend-inspired payload format**:

```json
{
  "success": true, // Boolean status
  "message": "Descriptive message for UI/UX", 
  "data": null,    // Null or structured payload
  "error": null    // Null or detailed error (omitted/secured in Production)
}
```

---

## 🚦 HTTP Status Code Reference

| Status Code | Code Name | Primary Application in devTinder |
| :--- | :--- | :--- |
| **`200 OK`** | `StatusCodes.OK` | Successful data retrieval, profile updates, or actions. |
| **`201 Created`** | `StatusCodes.CREATED` | Successful user signup or new database entity creation. |
| **`400 Bad Request`** | `StatusCodes.BAD_REQUEST` | Validation checks failed (e.g., Zod or Mongoose schema validations), or unapproved keys in body. |
| **`401 Unauthorized`** | `StatusCodes.UNAUTHORIZED` | Token expired, invalid/tampered JWT signature, or bad credentials on login. |
| **`403 Forbidden`** | `StatusCodes.FORBIDDEN` | Valid session but insufficient permissions to perform action. |
| **`404 Not Found`** | `StatusCodes.NOT_FOUND` | Database record doesn't exist, or route doesn't match the router list. |
| **`429 Too Many Requests`** | `StatusCodes.TOO_MANY_REQUESTS` | IP rate limit exceeded (express-rate-limit active at `/api`). |
| **`500 Internal Server`** | `StatusCodes.INTERNAL_SERVER_ERROR` | Unhandled programming errors (caught cleanly by Global Airbag). |

---

## 📡 Endpoints Deep Dive

### 1. System Health Monitoring

#### `GET /health`
* **Auth Requirement:** ❌ Public
* **Description:** Exposes node runtime metrics. Used by Azure load balancers, Kubernetes probes, or DevOps monitors to poll container status.
* **Query Parameters:** None
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Server is up and running!",
    "data": {
      "uptime": "124 minutes",
      "timestamp": "2026-08-14T11:53:07.000Z",
      "environment": "production"
    },
    "error": null
  }
  ```

---

### 2. Authentication Domain (`/auth`)
Mounted on: `/api/v1/auth`. **All routes inside this router are completely unauthenticated/public** to facilitate onboarding and session transitions without pre-existing credentials.

#### `POST /auth/signup`
* **Auth Requirement:** ❌ Public
* **Description:** Registers a new developer account. Cleans and sanitizes fields before triggering Mongoose `pre('save')` schema-level password hashing.
* **Request Body:**
  ```json
  {
    "firstName": "Monu",
    "lastName": "Kumar",
    "emailId": "monu.kd@devtinder.com",
    "password": "SecurePassword@123",
    "age": 22,
    "gender": "male",
    "skills": ["Node.js", "React", "MongoDB", "Express.js"],
    "about": "Junior Full Stack Engineer focusing on enterprise-grade systems."
  }
  ```
* **Success Response (`201 Created`):**
  ```json
  {
    "success": true,
    "message": "User created successfully!",
    "data": {
      "_id": "6a5dff82c66cd286da9c7da1",
      "firstName": "Monu",
      "lastName": "Kumar",
      "emailId": "monu.kd@devtinder.com",
      "age": 22,
      "gender": "male",
      "skills": ["Node.js", "React", "MongoDB", "Express.js"],
      "about": "Junior Full Stack Engineer focusing on enterprise-grade systems.",
      "photoUrl": "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
    },
    "error": null
  }
  ```
* **Error Response Example (`400 Bad Request`):**
  ```json
  {
    "success": false,
    "message": "Invalid data provided!",
    "data": null,
    "error": "First Name must only contain alphabets."
  }
  ```

---

#### `POST /auth/login`
* **Auth Requirement:** ❌ Public
* **Description:** Authenticates credentials, generates a stateless signed JWT, and sets it in an HTTP-only browser cookie (`token`). Returns safe serialized user profile details (automatically omitting the password hash via native schema overrides).
* **Request Body:**
  ```json
  {
    "emailId": "monu.kd@devtinder.com",
    "password": "SecurePassword@123"
  }
  ```
* **Success Response (`200 OK`):**
  * *Headers:* `Set-Cookie: token=eyJhbGci...; Path=/; HttpOnly; Secure; SameSite=Strict`
  * *Payload:*
    ```json
    {
      "success": true,
      "message": "OK",
      "data": {
        "_id": "6a5dff82c66cd286da9c7da1",
        "firstName": "Monu",
        "lastName": "Kumar",
        "emailId": "monu.kd@devtinder.com",
        "age": 22,
        "gender": "male",
        "skills": ["Node.js", "React", "MongoDB", "Express.js"],
        "about": "Junior Full Stack Engineer focusing on enterprise-grade systems.",
        "photoUrl": "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
      },
      "error": null
    }
    ```
* **Error Response Example (`401 Unauthorized`):**
  * *Security Note:* Prevents User Enumeration by using a generic message regardless of whether the email or password was incorrect.
  ```json
  {
    "success": false,
    "message": "Invalid credentials",
    "data": null,
    "error": "Unauthorized"
  }
  ```

---

#### `POST /auth/logout`
* **Auth Requirement:** ❌ Public (No `userAuth` middleware is attached to prevent session deadlocks when tokens expire or are cleared)
* **Description:** Instantly clears the signed session cookie from the client's browser. Highly idempotent; if the user's session is already expired or missing, it still resolves successfully.
* **Request Body:** None
* **Success Response (`200 OK`):**
  * *Headers:* `Set-Cookie: token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  * *Payload:*
    ```json
    {
      "success": true,
      "message": "Logout successful! Come back soon.",
      "data": null,
      "error": null
    }
    ```

---

### 3. Profile Domain (`/user/profile`)
Mounted on: `/api/v1/user/profile`. Protected globally by `userAuth`.

#### `GET /user/profile`
* **Auth Requirement:** 🔒 Protected
* **Description:** Extracts context variables from the decrypted JWT payload inside `userAuth` middleware and returns the authenticated user's rich profile. Generates **zero redundant database calls** by reusing the document cached at the gateway edge.
* **Request Body:** None
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Profile fetched successfully",
    "data": {
      "_id": "6a5dff82c66cd286da9c7da1",
      "firstName": "Monu",
      "lastName": "Kumar",
      "emailId": "monu.kd@devtinder.com",
      "age": 22,
      "gender": "male",
      "skills": ["Node.js", "React", "MongoDB", "Express.js"],
      "about": "Junior Full Stack Engineer focusing on enterprise-grade systems.",
      "photoUrl": "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
    },
    "error": null
  }
  ```

---

#### `PATCH /user/profile/edit`
* **Auth Requirement:** 🔒 Protected
* **Description:** Edits authorized profile parameters. Implements strict **Mass Assignment Protection** by matching keys against a secure schema whitelist. Evaluates differences to prevent zero-write DB trips.
* **Request Body:** (Can contain one or more whitelisted keys: `firstName`, `lastName`, `age`, `gender`, `photoUrl`, `about`, `skills`)
  ```json
  {
    "about": "Full-Stack Dev obsessed with clean, secure code and Nginx proxy configs.",
    "skills": ["React", "Node.js", "MongoDB", "Express", "Docker", "Nginx"]
  }
  ```
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Profile updated successfully!",
    "data": {
      "_id": "6a5dff82c66cd286da9c7da1",
      "firstName": "Monu",
      "lastName": "Kumar",
      "emailId": "monu.kd@devtinder.com",
      "age": 22,
      "gender": "male",
      "skills": ["React", "Node.js", "MongoDB", "Express", "Docker", "Nginx"],
      "about": "Full-Stack Dev obsessed with clean, secure code and Nginx proxy configs.",
      "photoUrl": "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
    },
    "error": null
  }
  ```

---

#### `PATCH /user/profile/password`
* **Auth Requirement:** 🔒 Protected
* **Description:** Standardizes the high-security password reset sequence. Decoupled entirely from generic edit profile paths. Validates complexity rules, ensures password cannot match the current one, hashes with 12 rounds of bcrypt, and invalidates active session tokens across all user devices.
* **Request Body:**
  ```json
  {
    "currentPassword": "SecurePassword@123",
    "newPassword": "BrandNewHighlySecurePassword#99"
  }
  ```
* **Success Response (`200 OK`):**
  * *Headers:* `Set-Cookie: token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  * *Payload:*
    ```json
    {
      "success": true,
      "message": "Password updated successfully! Please login with your new password.",
      "data": null,
      "error": null
    }
    ```

---

#### `DELETE /user/profile`
* **Auth Requirement:** 🔒 Protected
* **Description:** Permanently wipes the user's account from the database. Invokes specialized Mongoose document-level middleware to perform an **atomic cascading delete** of all connection requests involving this user ID, clean up active cookies, and prevent orphan references.
* **Request Body:** None
* **Success Response (`200 OK`):**
  * *Headers:* `Set-Cookie: token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  * *Payload:*
    ```json
    {
      "success": true,
      "message": "OK",
      "data": null,
      "error": null
    }
    ```

---

### 4. Connection Engine Domain (`/user/request`)
Mounted on: `/api/v1/user/request`. Protected globally by `userAuth`.

#### `POST /user/request/send/:status/:toUserId`
* **Auth Requirement:** 🔒 Protected
* **Description:** Initiates matchmaking or isolation. Evaluates strict edge cases: users cannot self-swipe, target user must exist, and duplicates are blocked if a connection request already exists between the two users.
* **URL Route Parameters:**
  * `:status` — Must be either `interested` (Right swipe) or `ignored` (Left swipe). Any other string yields a `400 Bad Request`.
  * `:toUserId` — Must be a valid 24-character hexadecimal MongoDB ObjectId.
* **Request Body:** None
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Connection request sent successfully!",
    "data": {
      "_id": "6a5dff82c66cd286da9c7db9",
      "fromUserId": "6a5dff82c66cd286da9c7da1",
      "toUserId": "6a5dff82c66cd286da9c7db3",
      "status": "interested"
    },
    "error": null
  }
  ```

---

#### `PATCH /user/request/review/:status/:requestId`
* **Auth Requirement:** 🔒 Protected
* **Description:** Evaluates and processes incoming developer requests. Requires the logged-in user to be the exact target (`toUserId`) of the target request, ensuring strict broken access control protection.
* **URL Route Parameters:**
  * `:status` — Must be strictly either `accepted` or `rejected`.
  * `:requestId` — The unique ID of the pending `ConnectionRequest` document.
* **Request Body:** None
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Connection request accepted successfully!",
    "data": {
      "_id": "6a5dff82c66cd286da9c7db9",
      "fromUserId": "6a5dff82c66cd286da9c7db3",
      "toUserId": "6a5dff82c66cd286da9c7da1",
      "status": "accepted"
    },
    "error": null
  }
  ```

---

### 5. Social & Discovery Feed Domain (`/user`)
Mounted on: `/api/v1/user`. Protected globally by `userAuth`.

#### `GET /user/connections`
* **Auth Requirement:** 🔒 Protected
* **Description:** Retrieves the authenticated developer's professional matches (connections with status `accepted`). Automatically populates match data, omitting system secrets and hashing schemas, and runs a mapping filter to omit the current user's profile from the returned array.
* **Request Body:** None
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "OK",
    "data": {
      "totalConnections": 2,
      "connections": [
        {
          "_id": "6a5dff82c66cd286da9c7db3",
          "firstName": "Ishita",
          "lastName": "Chawla",
          "age": 23,
          "gender": "female",
          "photoUrl": "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png",
          "about": "SEO expert transition to web dev."
        },
        {\n          "_id": "6a5dff82c66cd286da9c7db5",
          "firstName": "Meera",
          "lastName": "Nambiar",
          "age": 24,
          "gender": "female",
          "photoUrl": "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png",
          "about": "Writing clean tests and automating QA."
        }
      ]
    },
    "error": null
  }
  ```

---

#### `GET /user/requests/received`
* **Auth Requirement:** 🔒 Protected
* **Description:** Compiles all incoming connection requests in the `interested` state waiting for the user's review. Safely populates the sender's details while dropping unnecessary metadata keys.
* **Request Body:** None
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "OK",
    "data": [
      {
        "_id": "6a5dff82c66cd286da9c7db9",
        "status": "interested",
        "fromUserId": {
          "_id": "6a5dff82c66cd286da9c7db3",
          "firstName": "Ishita",
          "lastName": "Chawla",
          "age": 23,
          "gender": "female",
          "photoUrl": "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png",
          "about": "SEO expert transition to web dev."
        }
      }
    ],
    "error": null
  }
  ```

---

#### `GET /user/feed`
* **Auth Requirement:** 🔒 Protected
* **Description:** The discovery engine. Fetches safe developer cards for the swiping deck. Excludes: (1) self, (2) active connections, (3) pending sent/received requests, (4) ignored users. Highly optimized using `$nin` array operations and projection selects.
* **Query Parameters:**
  * `page` — For offset pagination. Default is `1`.
  * `limit` — Quantity per page. Default is `10` (Hard capped at `50` to protect database bandwidth).
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "OK",
    "data": {
      "totalUsers": 1,
      "feed": [
        {
          "_id": "6a5dff82c66cd286da9c7db7",
          "firstName": "Tanvi",
          "lastName": "Jain",
          "age": 25,
          "gender": "female",
          "photoUrl": "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png",
          "about": "Creative coder. WebGL and Three.js.",
          "skills": ["WebGL", "Three.js", "JavaScript"]
        }
      ]
    },
    "error": null
  }
  ```

---

## 🛑 Rate Limiter and IP Ban Safeguards

The devTinder API utilizes `express-rate-limit` coupled with Nginx upstream mappings. 
* Any single IP exceeding **100 requests per 15-minute window** is locked out to mitigate DDOS attempts, scrape operations, and brute-force auth attacks.
* When blocked, endpoints return a standard `429 Too Many Requests` status code with the following wrapper:
  ```json
  {
    "success": false,
    "message": "Too many requests from this IP, please try again after 15 minutes.",
    "error": "Too Many Requests"
  }
  ```
