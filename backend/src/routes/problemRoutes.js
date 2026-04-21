import express from "express";

const router = express.Router();

const LEETCODE_GRAPHQL = "https://leetcode.com/graphql";

const PROBLEM_DETAIL_QUERY = `
  query getProblemDetail($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionFrontendId
      title
      titleSlug
      difficulty
      content
      exampleTestcaseList
      topicTags {
        name
        slug
      }
      hints
    }
  }
`;

/**
 * GET /api/problem/:slug
 * Proxies a request to the LeetCode public GraphQL API to fetch
 * full problem content (description, examples, tags, hints).
 *
 * Returns { frontendId, title, slug, difficulty, content, exampleTestcases, topicTags, hints }
 * or { error: "..." } on failure so the frontend can fall back gracefully.
 */
router.get("/:slug", async (req, res) => {
    const { slug } = req.params;

    if (!slug) {
        return res.status(400).json({ error: "Problem slug is required" });
    }

    try {
        const response = await fetch(LEETCODE_GRAPHQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // LeetCode requires a referer and user-agent to not block server-side requests
                "Referer": "https://leetcode.com",
                "User-Agent":
                    "Mozilla/5.0 (compatible; TalentIQ/1.0)",
                "Origin": "https://leetcode.com",
            },
            body: JSON.stringify({
                query: PROBLEM_DETAIL_QUERY,
                variables: { titleSlug: slug },
            }),
        });

        if (!response.ok) {
            throw new Error(`LeetCode GraphQL responded with ${response.status}`);
        }

        const json = await response.json();
        const q = json?.data?.question;

        if (!q) {
            return res.status(404).json({ error: "Problem not found on LeetCode" });
        }

        return res.json({
            frontendId: q.questionFrontendId,
            title: q.title,
            slug: q.titleSlug,
            difficulty: q.difficulty,
            content: q.content || "", // raw HTML from LeetCode (sanitized on the frontend)
            exampleTestcases: q.exampleTestcaseList || [],
            topicTags: (q.topicTags || []).map((t) => t.name),
            hints: q.hints || [],
        });
    } catch (err) {
        console.error("[problemRoutes] Error fetching from LeetCode GraphQL:", err.message);
        // Return a graceful degradation response — frontend shows "Open on LeetCode"
        return res.status(502).json({
            error: "Could not fetch problem details from LeetCode. Please view on LeetCode directly.",
        });
    }
});

export default router;
