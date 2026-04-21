const LEETCODE_API_BASE = "https://leetcode-api-pied.vercel.app";
// Strip trailing /api suffix to get the bare server URL for our custom routes
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const BACKEND_BASE = API_URL.endsWith("/api") ? API_URL.slice(0, -4) : API_URL;


export const leetcodeApi = {
    /**
     * Fetch all problems from the LeetCode API.
     * Returns an array of problem objects:
     * { id, frontend_id, title, title_slug, url, difficulty, paid_only, has_solution, has_video_solution }
     */
    getProblems: async () => {
        const response = await fetch(`${LEETCODE_API_BASE}/problems`);
        if (!response.ok) {
            throw new Error(`Failed to fetch problems: ${response.statusText}`);
        }
        return response.json();
    },

    /**
     * Fetch full problem details (description HTML, topic tags, hints) via
     * our backend proxy to the LeetCode GraphQL API.
     * Returns { frontendId, title, slug, difficulty, content, exampleTestcases, topicTags, hints }
     * Throws on network error so React Query can handle retry/fallback.
     */
    getProblemDetail: async (slug) => {
        const response = await fetch(`${BACKEND_BASE}/api/problem/${slug}`);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Failed to fetch problem details");
        }
        return data;
    },
};
