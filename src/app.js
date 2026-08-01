const express = require('express')
const app = express()
const cookieParser = require('cookie-parser')
const cors = require('cors')
const v1Router = require('./routes/v1')
const {globalLogger} = require('./middlewares/logger')
const {notFoundHandler,globalErrorHandler} = require('./middlewares/errorHandler')

//-----cors setting for frontend-----
app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));
//-----Middleware-----
app.use(express.json()) 
app.use(cookieParser())
app.use(globalLogger)

//-----Routes-----
app.use('/api/v1/',v1Router)

//-----Error Handling-----
app.use(notFoundHandler)
app.use(globalErrorHandler)




module.exports = app;





