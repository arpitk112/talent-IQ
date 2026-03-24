import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "../lib/env.js";

const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);

export const generateResume = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            linkedin,
            github,
            summary,
            skills,
            experience,
            education,
            projects,
        } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: "Name and email are required." });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
You are an expert LaTeX resume writer. Generate a clean, professional, and ATS-friendly resume in **LaTeX** using the standard \`article\` class.

## Instructions
- Output ONLY valid, self-contained LaTeX code starting with \`\\documentclass{article}\` and ending with \`\\end{document}\`.
- Do NOT wrap the LaTeX code in markdown code blocks (e.g. no \`\`\`latex or \`\`\`). Just output the raw code.
- Escape all special LaTeX characters in the user's data (like \`%\`, \`&\`, \`$\`, \`#\`, \`_\`, \`{\`, \`}\`, \`~\`, \`^\`, \`\\\`).
- Make the layout modern but simple using standard packages like \`geometry\`, \`hyperref\`, \`enumitem\`, \`titlesec\`.
- Keep the margins tight (e.g., 0.5in) to fit everything on one page if possible.
- Use clear sections for: Summary, Skills, Experience, Education, Projects.
- Do NOT add placeholder text. Only use the data provided.

## Candidate Data

**Name:** ${name}
**Email:** ${email}
**Phone:** ${phone || "Not provided"}
**LinkedIn:** ${linkedin || "Not provided"}
**GitHub:** ${github || "Not provided"}

**Professional Summary:**
${summary || "Not provided"}

**Skills:**
${Array.isArray(skills) ? skills.join(", ") : skills || "Not provided"}

**Experience:**
${
    Array.isArray(experience) && experience.length > 0
        ? experience
              .map(
                  (e) =>
                      `- Title: ${e.title}, Company: ${e.company}, Duration: ${e.duration}, Description: ${e.description}`
              )
              .join("\n")
        : "Not provided"
}

**Education:**
${
    Array.isArray(education) && education.length > 0
        ? education
              .map((e) => `- Degree: ${e.degree}, School: ${e.school}, Year: ${e.year}`)
              .join("\n")
        : "Not provided"
}

**Projects:**
${
    Array.isArray(projects) && projects.length > 0
        ? projects
              .map(
                  (p) =>
                      `- Name: ${p.project_name || p.name}, Description: ${p.description}, Tech: ${p.techStack}`
              )
              .join("\n")
        : "Not provided"
}

Craft the pure LaTeX resume now:
`;

        const result = await model.generateContent(prompt);
        const resumeText = result.response.text();

        return res.status(200).json({ resume: resumeText });
    } catch (error) {
        console.error("Error generating resume:", error);
        return res.status(500).json({ message: "Failed to generate resume. Please try again." });
    }
};
