import mongoose from "mongoose";

import { ENV } from "./env.js";

export const connectDB = async () => {
    try {
        if (!ENV.DB_URL) {
            throw new Error("DB_URL is not defined");
        }
        await mongoose.connect(ENV.DB_URL);
        console.log("MongoDB connected");
    } catch (error) {
        console.log("MongoDB connection error", error);
        process.exit(1); //0 means success and 1 means failure
    }
}