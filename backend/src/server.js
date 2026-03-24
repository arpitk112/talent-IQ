import express from 'express'
import path from 'path'
import cors from 'cors'
import { serve } from "inngest/express";

import { ENV } from './lib/env.js';
import { connectDB } from './lib/db.js';
import { inngest, functions } from "./lib/inngest.js";
import { clerkMiddleware } from '@clerk/express'

import chatRoutes from "./routes/chatRoutes.js"
import sessionRoutes from "./routes/sessionRoutes.js"
import executeRoutes from "./routes/executeRoutes.js"
import resumeRoutes from "./routes/resumeRoutes.js"

const app = express();

const __dirname = path.resolve();

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(clerkMiddleware());

// CORS configuration (Flexible for development & robust for production)
const allowedOrigins = ENV.NODE_ENV === "production" 
    ? [ENV.FRONTEND_URL] 
    : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://127.0.0.1:5173"];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const normalizedOrigin = origin.replace(/\/$/, "");
        const isAllowed = allowedOrigins.some(allowed => allowed && allowed.replace(/\/$/, "") === normalizedOrigin);
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use("/api/inngest", serve({ client: inngest, functions }))
app.use("/api/chat", chatRoutes)
app.use("/api/sessions", sessionRoutes)
app.use("/api/execute", executeRoutes)
app.use("/api/resume", resumeRoutes)

app.get("/health", (req, res) => {
    res.status(200).json({ msg: "api is up and running" })
})

// Build configuration for monolithic deployment (optional)
if (ENV.NODE_ENV === "production" && !ENV.FRONTEND_URL) {
    app.use(express.static(path.join(__dirname, "../frontend/dist")))

    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
    });
}

const startServer = async () => {
    try {
        await connectDB();
        app.listen(ENV.PORT, () => {
            console.log(`Server running on http://localhost:${ENV.PORT}`);
        })
    } catch (error) {
        console.log("Error starting server", error);
        process.exit(1);
    }
}

startServer();