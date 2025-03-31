import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { summaryCode } from "./gemini";
import { Document } from "@langchain/core/documents";
import { db } from "~/server/db";
import { generateEmbeddingAi } from "../lib/gemini";
import { error } from "console";

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
  const docs = await loader.load();
  console.log(docs);
  return docs;
};

export const indexGitRepo = async (
  projectId: string,
  githubUrl: string,
  githubToken?: string,
) => {
  const docs = await loadGithubRepo(githubUrl, githubToken);
  const allEmbeddings = await generateEmbeddings(docs);

  await Promise.allSettled(
    allEmbeddings.map(async (embedding, index) => {
      console.log(`Processing ${index} of ${allEmbeddings.length}`);
      if (!embedding.summary) {
        console.warn("summary not by ai");
        return;
      }
      const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
        data: {
          sourceCode: embedding.sourceCode,
          projectId: projectId,
          summary: embedding.summary,
          fileName: embedding.fileName,
        },
      });
      console.log(sourceCodeEmbedding);

      await db.$executeRaw`
      UPDATE "SourceCodeEmbedding"
      SET "summaryEmbedding" = ${embedding.embedding} :: vector
      WHERE "id" = ${sourceCodeEmbedding.id}
    `;
    }),
  );
};

const generateEmbeddings = async (docs: Document[]) => {
  return await Promise.all(
    docs.map(async (doc) => {
      const summary = await summaryCode(doc); // Ensure correct type
      const embedding = await generateEmbeddingAi(summary as string);
      console.log(summary);
      console.log(embedding); //

      if (!summary) {
        console.log("sumamry not by summarycode");
        return;
      }

      //  Fixed function call
      return {
        summary,
        embedding,
        sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
        fileName: doc.metadata.source,
      };
    }),
  );
};
