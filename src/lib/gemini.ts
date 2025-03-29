import dotenv from "dotenv";
dotenv.config();
import { GoogleGenAI } from "@google/genai";
import axios from "axios";

// const diff = await readCommit();

// Load API key
const apiKey = process.env.GEMINI_API_KEY;
console.log(apiKey);
if (!apiKey) {
  console.error("API key is missing. Check your .env file.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

// Function to summarize git diff
export async function summariesCommit(url: string) {
  const res = await axios.get(url, {
    headers: {
      Accept: "application/vnd.github.v3.diff",
    },
  });
  const diff = await res.data; // Read response as text
  console.log(diff);

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `
    You are an expert programmer, and you are trying to summarize a git diff.
  
    Reminders about the git diff format:
    - Each file starts with a few metadata lines, like:
    \`\`\`
    diff --git a/lib/index.js b/lib/index.js
    index aadf691..bfef603 100644
    --- a/lib/index.js
    +++ b/lib/index.js
    \`\`\`
    This means that \`lib/index.js\` was modified in this commit.
    - A line starting with \`+\` means it was **added**.
    - A line starting with \`-\` means it was **deleted**.
    - A line that starts with neither \`+\` nor \`-\` is **context code**.
  
    Example Summary Comments:
    \`\`\`
    * Increased the returned recordings limit from "10" to "100" [packages/server/recordings_api.ts, packages/server/constants.ts]
    * Fixed a typo in the GitHub action name [.github/workflows/gpt-commit-summarizer.yml]
    * Refactored \`octokit\` initialization to a separate file [src/octokit.ts, src/index.ts]
    * Added OpenAI API for completions [packages/utils/apis/openai.ts]
    * Adjusted numeric tolerance in test files
    \`\`\`
  
    Now, **please summarize the following diff file:**\n\n${diff.slice(0, 5000)}
    `,
  });

  return response.text;
}
