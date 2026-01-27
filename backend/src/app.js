import express, { urlencoded } from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser'
const app = express();

// Configure CORS to accept requests from frontend
app.use(cors({
    origin: [process.env.ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//import route
import userRouter from '../src/routes/user.route.js'
import courseRouter from '../src/routes/course.route.js'

app.use("/api/v1/user",userRouter)//middleware
app.use("/api/v1/course",courseRouter)//middleware

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ message: "Server is running" });
});

// 404 Not Found handler
app.use((req, res) => {
    res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Route not found",
        data: null
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    console.error(`Error: ${status} - ${message}`);
    
    return res.status(status).json({
        statusCode: status,
        success: false,
        message: message,
        errors: err.errors || [],
        data: null
    });
});

export default app