import dotenv from "dotenv";
dotenv.config();
import { GoogleGenAI } from "@google/genai";
import { GoogleGenerativeAI } from "@google/generative-ai";

import axios from "axios";
import { Document } from "@langchain/core/documents";
import { string } from "zod";

// const diff = await readCommit();

// Load API key
const apiKey = process.env.GEMINI_API_KEY;
console.log(apiKey);
if (!apiKey) {
  console.error("API key is missing. Check your .env file.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });
const genAI = new GoogleGenerativeAI(apiKey);

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
  
    Now, **please summarize the following diff file:**\n\n${diff}
    `,
  });

  return response.text;
}

export const summaryCode = async (doc: Document) => {
  console.log("getting summary for ", doc.metadata.source);
  const code = await doc.pageContent.slice(0, 10000);
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: ` 
   * You are an intelligent senior software engineer who specialises in onboarding junior software engineers onto projects.
    * You are onboarding a junior software engineer and explaining to them the purpose of the $(doc.metadata.source) file.
    *  Here is the code:
${code}
Give a summary no more than 150 words of the code above
    `,
  });
  return response.text;
};

export async function generateEmbedding(summary: string) {
  try {
    const model = genAI.getGenerativeModel({
      model: "models/embedding-001", // Replace with the correct embedding model name if needed
    });
    const result = await model.embedContent(summary);
    return result.embedding.values; // Return the embedding values
  } catch (error: any) {
    console.error("Error generating embedding:", error);
    return null; // Or handle the error as needed
  }
}

// console.log(await generateEmbedding("hello world"));
