import express from "express";
import { ENV } from "../lib/env.js";

const router = express.Router();

// JDoodle language config
const JDOODLE_LANGUAGES = {
    javascript: { language: "nodejs", versionIndex: "4" },
    python: { language: "python3", versionIndex: "4" },
    java: { language: "java", versionIndex: "4" },
};

router.post("/", async (req, res) => {
    try {
        const { language, code } = req.body;

        const langConfig = JDOODLE_LANGUAGES[language];
        if (!langConfig) {
            return res.status(400).json({ success: false, error: `Unsupported language: ${language}` });
        }

        const response = await fetch("https://api.jdoodle.com/v1/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                clientId: ENV.JDOODLE_CLIENT_ID,
                clientSecret: ENV.JDOODLE_CLIENT_SECRET,
                script: code,
                language: langConfig.language,
                versionIndex: langConfig.versionIndex,
            }),
        });

        const data = await response.json();

        // JDoodle returns statusCode 200 for success, 400+ for errors
        // output contains the program output, error field if any
        if (!response.ok) {
            return res.status(502).json({ success: false, error: data.error || "JDoodle API error" });
        }

        // JDoodle uses isExecutionSuccess bool and error string for failures
        const output = (data.output || "").trim();
        const isSuccess = data.isExecutionSuccess === true;

        if (!isSuccess) {
            return res.json({ success: false, error: output || data.error || "Execution failed", output: "" });
        }

        return res.json({ success: true, output: output || "No output" });
    } catch (error) {
        console.error("Execute route error:", error);
        return res.status(500).json({ success: false, error: `Failed to execute code: ${error.message}` });
    }
});

export default router;
