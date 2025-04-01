import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { summaryCode } from "./gemini";
import { Document } from "@langchain/core/documents";
import { db } from "~/server/db";
import { generateEmbeddingAi } from "../lib/gemini";

// Load the repository from GitHub
export const loadGithubRepo = async (
  githubUrl: string,
  githubToken?: string,
) => {
  const loader = new GithubRepoLoader(githubUrl, {
    accessToken: process.env.GITHUB_TOKEN,
    branch: "main",
    recursive: true,
    unknown: "warn",
    ignoreFiles: ["package.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb"],
    maxConcurrency: 5, // Defaults to 2
  });

  try {
    const docs = await loader.load();
    console.log("Loaded documents:", docs.length);
    return docs;
  } catch (err) {
    console.error("Error loading repo:", err);
    throw err;
  }
};

// Indexing the loaded repository into the database
export const indexGitRepo = async (
  projectId: string,
  githubUrl: string,
  githubToken?: string,
) => {
  const docs = await loadGithubRepo(githubUrl, githubToken);
  const allEmbeddings = await generateEmbeddings(docs);

  try {
    const results = await Promise.allSettled(
      allEmbeddings.map(async (embedding, index) => {
        console.log(`Processing ${index + 1} of ${allEmbeddings.length}`);

        if (!embedding.summary || !embedding.embedding) {
          console.warn(
            `Failed to generate embedding for file: ${embedding.fileName}`,
          );
          return;
        }

        try {
          const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
            data: {
              sourceCode: embedding.sourceCode,
              projectId: projectId,
              summary: embedding.summary,
              fileName: embedding.fileName,
            },
          });

          console.log("Inserted to DB:", sourceCodeEmbedding.fileName);

          await db.$executeRaw`
            UPDATE "SourceCodeEmbedding"
            SET "summaryEmbedding" = ${embedding.embedding}::vector
            WHERE "id" = ${sourceCodeEmbedding.id}
          `;
        } catch (dbError) {
          console.error("Database Error:", dbError);
        }
      }),
    );

    console.log("Indexing completed.");
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`Failed processing index ${index + 1}:`, result.reason);
      }
    });
  } catch (err) {
    console.error("Error during embedding process:", err);
  }
};

// Generate embeddings for the documents
const generateEmbeddings = async (docs: Document[]) => {
  return await Promise.all(
    docs.map(async (doc) => {
      try {
        const summary = await summaryCode(doc); // Assuming this returns a string summary
        if (!summary) {
          throw new Error(
            `Failed to summarize document: ${doc.metadata.source}`,
          );
        }

        const embedding = await generateEmbeddingAi(summary as string);

        if (!embedding) {
          throw new Error(
            `Failed to generate embedding for document: ${doc.metadata.source}`,
          );
        }

        console.log("Summary:", summary);
        console.log("Embedding:", embedding);

        return {
          summary,
          embedding,
          sourceCode: doc.pageContent,
          fileName: doc.metadata.source,
        };
      } catch (err) {
        console.error("Error processing document:", err);
        return {
          summary: null,
          embedding: null,
          sourceCode: doc.pageContent,
          fileName: doc.metadata.source,
        };
      }
    }),
  );
};
