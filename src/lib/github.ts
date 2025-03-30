import { Octokit } from "octokit";
import { db } from "~/server/db";
import { summariesCommit } from "./gemini";
import axios from "axios";

export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

interface CommitInfo {
  commitHash: string;
  commitDate: string;
  commitAuthorName: string;
  commitAuthorAvatar: string;
  commitMessage: string;
}

const extractOwnerRepo = (
  githubUrl: string,
): { owner: string; repo: string } => {
  const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)(?:\.git)?$/);
  if (!match) throw new Error("Invalid GitHub URL");
  return { owner: match[1] as string, repo: match[2] as string };
};

export const getCommitHash = async (
  githubUrl: string,
): Promise<CommitInfo[]> => {
  const { owner, repo } = extractOwnerRepo(githubUrl);

  if (!owner || !repo) {
    throw new Error("Invalid GitHub URL");
  }

  const { data } = await octokit.rest.repos.listCommits({
    owner,
    repo,
    per_page: 10, // Limit commits to 10 instead of sorting manually
  });

  return data.map((commit) => ({
    commitHash: commit.sha,
    commitDate: commit.commit.author?.date ?? "",
    commitAuthorName: commit.commit.author?.name ?? "",
    commitAuthorAvatar: commit.author?.avatar_url ?? "",
    commitMessage: commit.commit.message ?? "",
  }));
};

export const pollCommits = async (projectId: string) => {
  const { githubUrl } = await fetchProjectGithubUrl(projectId);
  if (!githubUrl) throw new Error("GitHub URL not found for project");

  const commitHashes = await getCommitHash(githubUrl);
  console.log("Fetched Commits:", commitHashes);

  const unprocessedCommits = await filterUnprocessedCommits(
    projectId,
    commitHashes,
  );
  const summaryResponse = await Promise.allSettled(
    unprocessedCommits.map((commit) => {
      return SummaryAi(githubUrl, commit.commitHash);
    }),
  );

  const summaries = summaryResponse.map((response) => {
    if (response.status === "fulfilled") {
      return response.value as string;
    } else {
      return "No summary available";
    }
  });
  console.log(summaries);
  const commits = await db.commit.createMany({
    data: summaries.map((summary, index) => {
      console.log(`Processing commit ${index + 1}`);
      return {
        projectId,
        commitHash: unprocessedCommits[index]!.commitHash,
        commitMessage: unprocessedCommits[index]!.commitMessage,
        commitDate: unprocessedCommits[index]!.commitDate,
        commitAuthorName: unprocessedCommits[index]!.commitAuthorName,
        commitAuthorAvatar: unprocessedCommits[index]!.commitAuthorAvatar,
        summary: summary,
      };
    }),
  });

  return commits;
};

const fetchProjectGithubUrl = async (projectId: string) => {
  const project = await db.projects.findUnique({
    where: { id: projectId },
    select: { githubUrl: true },
  });
  return { githubUrl: project?.githubUrl ?? "" };
};

async function SummaryAi(githubUrl: string, commitHash: string) {
  const diffUrl = `${githubUrl}/commit/${commitHash}.diff`;
  console.log(diffUrl);
  try {
    const summary = await summariesCommit(diffUrl);
    console.log("Generated Summary:", summary);

    return summary;
  } catch (error: any) {
    console.error(
      "Error fetching commit diff:",
      error.response?.status,
      error.response?.data,
    );
    return "Error fetching summary";
  }
}

async function filterUnprocessedCommits(
  projectId: string,
  commitHashes: CommitInfo[],
) {
  const processedCommits = await db.commit.findMany({
    where: { projectId },
    select: { commitHash: true },
  });

  const processedCommitHashes = new Set(
    processedCommits.map((commit) => commit.commitHash),
  );

  return commitHashes.filter(
    (commit) => !processedCommitHashes.has(commit.commitHash),
  );
}
