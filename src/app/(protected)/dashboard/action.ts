"use server";
import { streamText } from "ai";
import { createStreamableValue } from "ai/rsc";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateEmbeddingAi } from "~/lib/gemini";
import { db } from "~/server/db";

// Ensure you load your environment variables correctly
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY3,
});

export async function askQuestion(question: string, projectId: string) {
  const stream = createStreamableValue();
  let result: {
    fileName: string;
    sourceCode: string;
    summary: string;
    similarity: number;
  }[] = [];

  try {
    // Generate the query vector using your embedding AI
    const queryVector = await generateEmbeddingAi(question);
    if (!queryVector) {
      throw new Error("Failed to generate query embedding.");
    }

    // Fetch relevant documents from your database with a lower similarity threshold
    result = (await db.$queryRaw`
      SELECT "fileName", "sourceCode", "summary", 
        1 - ("summaryEmbedding" <=> ${queryVector}::vector) AS similarity
      FROM "SourceCodeEmbedding"
      WHERE 1 - ("summaryEmbedding" <=> ${queryVector}::vector) > 0.3
      AND "projectId" = ${projectId}
      ORDER BY similarity DESC
      LIMIT 10;
    `) as typeof result;

    if (result.length === 0) {
      stream.update(
        "No relevant code found for your question. Please try rephrasing.",
      );
      stream.done();
      return { output: stream.value, fileReference: [] };
    }
  } catch (error) {
    console.error("Error fetching similar documents:", error);
    stream.update(
      "An error occurred while processing your question. Please try again later.",
    );
    stream.done();
    return { output: stream.value, fileReference: [] };
  }

  // Build the context string from your database results
  const context = result
    .map((doc) => {
      const codeContent =
        doc.sourceCode.length > 1000
          ? doc.sourceCode.slice(0, 1000) + "..."
          : doc.sourceCode;

      return `File: ${doc.fileName}
Summary: ${doc.summary || "No summary available"}
Code:
\`\`\`
${codeContent}
\`\`\`
---`;
    })
    .join("\n");

  console.log("Context for question:", question);
  console.log("Context:", context);

  try {
    const model = google("gemini-1.5-pro");
    const { textStream } = await streamText({
      model,
      prompt: `
You are a helpful AI assistant that answers questions about code. You have access to relevant code snippets and their summaries.

Here are the relevant code files and their contents:

${context}

Question: ${question}

Instructions:
1. Analyze the provided code and summaries
2. If the code contains the answer, provide a detailed explanation
3. If the code doesn't contain the answer, say "I don't have enough information to answer that question"
4. Format your response in markdown
5. Include relevant code snippets in your explanation using markdown code blocks
6. If you see any potential issues or improvements in the code, mention them
7. Keep your response concise but informative

Response:`,
    });

    for await (const delta of textStream) {
      stream.update(delta);
    }
    stream.done();
  } catch (error) {
    console.error("Error generating response:", error);
    stream.update("An error occurred while generating the response.");
    stream.done();
  }

  return {
    output: stream.value,
    fileReference: result,
  };
}
