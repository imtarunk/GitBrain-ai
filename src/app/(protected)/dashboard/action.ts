"use server";
import { streamText } from "ai";
import { createStreamableValue } from "ai/rsc";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateEmbedding } from "~/lib/gemini";
import { db } from "~/server/db";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function askQuestion(question: string, projectId: string) {
  const stream = createStreamableValue();
  const queryVector = await generateEmbedding(question);
  const vectorQuery = `[${queryVector?.join(",")}]`;

  const result = (await db.$queryRaw`
  SELECT "fileName","sourceCode","summary"
  1-("summaryEmbedding" <=> ${vectorQuery} :: vector) > .5
  AND "projectId" = ${projectId}
  ORDER BY "summaryEmbedding" DESC 
  LIMIT 10 
  `) as {
    fileName: string;
    sourceCode: string;
    summary: string;
    similarity: number;
  }[];

  let context = "";

  for (const doc of result) {
    context += `source ${doc.fileName}\ncode content :${doc.sourceCode}\n summary of file: ${doc.fileName} : ${doc.summary}\n`;
  }

  async () => {
    const { textStream } = await streamText({
      model: google("gemini-1.5-pro"),
      prompt: `
      
      `,
    });
  };
}
