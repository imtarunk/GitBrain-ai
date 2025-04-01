import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import { Document } from "@langchain/core/documents";

// Load API key
const apiKey = process.env.GEMINI_API_KEY;
const apiKey2 = process.env.GEMINI_API_KEY2;

if (!apiKey || !apiKey2) {
  throw new Error("Missing Gemini API keys in environment variables");
}

const genAIText = new GoogleGenerativeAI(apiKey);
const genAIEmbed = new GoogleGenerativeAI(apiKey2);

// Rate limiting configuration
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second
const RATE_LIMIT_DELAY = 20000; // 20 seconds
const MAX_REQUESTS_PER_MINUTE = 15;
let requestCount = 0;
let lastRequestTime = Date.now();

// Reset request count every minute
setInterval(() => {
  requestCount = 0;
  lastRequestTime = Date.now();
}, 60000);

async function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  // If we've made too many requests, wait until the next minute
  if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
    const waitTime = 60000 - timeSinceLastRequest;
    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    requestCount = 0;
    lastRequestTime = Date.now();
  }

  // If we're making requests too quickly, add a small delay
  if (timeSinceLastRequest < 100) {
    // Minimum 100ms between requests
    await new Promise((resolve) =>
      setTimeout(resolve, 100 - timeSinceLastRequest),
    );
  }

  requestCount++;
  lastRequestTime = Date.now();
}

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await waitForRateLimit();
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt} failed:`, error);

      // Check if it's a rate limit error
      if (error instanceof Error && error.message.includes("429")) {
        const retryDelay = RATE_LIMIT_DELAY * attempt;
        console.log(`Rate limit hit, waiting ${retryDelay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        continue;
      }

      if (attempt < maxRetries) {
        const delay = BASE_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  throw lastError;
}

export async function summariesCommit(url: string) {
  try {
    const res = await axios.get(url, {
      headers: { Accept: "application/vnd.github.v3.diff" },
    });

    const diff = res.data.slice(0, 1500);

    return await withRetry(async () => {
      const model = genAIText.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `You are an expert programmer summarizing git diffs. Follow these rules:
      1. Focus on meaningful changes
      2. Ignore formatting changes
      3. Group related file modifications
      4. Use concise bullet points
      
      Diff:\n${diff}`;

      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    });
  } catch (err) {
    console.error("Summarization error:", err);
    return "Failed to generate summary. Please try again.";
  }
}

export const summaryCode = async (doc: Document) => {
  try {
    const code = doc.pageContent.slice(0, 10000);

    return await withRetry(async () => {
      const model = genAIText.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Explain this code from ${doc.metadata.source} to a junior developer:
      - Purpose
      - Key functions
      - Important patterns
      - 100 words maximum
      
      Code:\n${code}`;

      const result = await model.generateContent(prompt);
      const response = result.response.text().trim();

      if (!response || response.length < 10) {
        throw new Error("Generated response is too short or empty");
      }

      return response;
    });
  } catch (err) {
    console.error("Code summary error:", err);
    // Return a more descriptive error message
    return `Failed to generate code explanation: ${err instanceof Error ? err.message : "Unknown error"}`;
  }
};

export async function generateEmbeddingAi(text: string) {
  try {
    return await withRetry(async () => {
      const model = genAIEmbed.getGenerativeModel({
        model: "models/embedding-001",
      });
      const result = await model.embedContent(text);

      if (!result.embedding.values || result.embedding.values.length === 0) {
        throw new Error("Generated embedding is empty");
      }

      return result.embedding.values;
    });
  } catch (error) {
    console.error("Embedding error:", error);
    throw new Error(
      `Failed to generate embedding: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
