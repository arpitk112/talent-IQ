import express from 'express'
import path from 'path'
import { ENV } from './lib/env.js';
import { connectDB } from './lib/db.js';

const app = express();

const __dirname = path.resolve();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (ENV.NODE_ENV !== "production") {
    const { default: cors } = await import("cors");
    app.use(cors({ origin: "http://localhost:5173", credentials: true }));
}

app.get("/health", (req, res) => {
    res.status(200).json({ msg: "api is up and running" })
})

if (ENV.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")))

    app.get("/{*any}", (req, res) => {
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