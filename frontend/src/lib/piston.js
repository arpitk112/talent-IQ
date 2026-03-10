// Code execution via our backend proxy (JDoodle)

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const SUPPORTED_LANGUAGES = ["javascript", "python", "java"];

/**
 * @param {string} language - programming language
 * @param {string} code - source code to execute
 * @returns {Promise<{success:boolean, output?:string, error?: string}>}
 */
export async function executeCode(language, code) {
    try {
        if (!SUPPORTED_LANGUAGES.includes(language)) {
            return {
                success: false,
                error: `Unsupported language: ${language}`,
            };
        }

        const response = await fetch(`${API_URL}/execute`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ language, code }),
        });

        const data = await response.json();

        return data;
    } catch (error) {
        return {
            success: false,
            error: `Failed to execute code: ${error.message}`,
        };
    }
}