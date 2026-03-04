import { StreamChat } from "stream-chat"
import { ENV } from "./env.js"


const apiKey = ENV.STREAM_API_KEY
const apiSecret = ENV.STREAM_API_SECRET

if (!apiKey || !apiSecret) {
    console.log("STREAM_API_KEY or STREAM_API_SECRET is missing");
}

export const chatClient = StreamChat(apiKey, apiSecret)

export const upsertStreamUser = async (userData) => {
    try {
        await chatClient.upsertUser(userData)
        console.log("Stream user upserted successfully:", userData)
    }
    catch (err) {
        console.error("Error upserting Stream user:", err)
    }
}

export const deleteStreamUser = async (userId) => {
    try {
        await chatClient.deleteUser(userId)
        console.log("Stream User deleted Successfully:", userId)
    }
    catch (err) {
        console.error("Error deleting Stream user:", err)
    }
}