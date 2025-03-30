"use client";

import { ExternalLink } from "lucide-react";
import useProject from "~/hooks/use-project";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import Link from "next/link";

const CommitLog = () => {
  const { projectId, project } = useProject();
  const { data: commits, isLoading } = api.project.getCommits.useQuery(
    { projectId },
    { enabled: !!projectId, suspense: true },
  );

  if (isLoading) {
    return <div className="p-4 text-gray-500">Loading commits...</div>;
  }

  if (!commits?.length) {
    return <div className="p-4 text-gray-500">No commits found.</div>;
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-4">
        {commits.map((commit, commitIdx) => (
          <li key={commit.id} className="relative flex gap-x-4">
            <div
              className={cn(
                "absolute top-0 left-0 flex w-6 justify-center",
                commitIdx === commits.length - 1 ? "h-6" : "-bottom-6",
              )}
            >
              <div className="h-full w-px translate-x-1 bg-gray-200"></div>
            </div>

            <div className="animated-avatar-container relative mt-3 flex-none">
              {commit.commitAuthorAvatar ? (
                <img
                  src={commit.commitAuthorAvatar}
                  alt="Author's avatar"
                  className="size-10 rounded-full bg-gray-50"
                />
              ) : (
                <div className="flex size-10 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                  {(commit.commitAuthorName || "?").charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="shine-effect flex-1 rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200">
              <div className="mb-2 flex items-start justify-between gap-x-2">
                <div>
                  <span className="font-medium text-gray-900">
                    {commit.commitAuthorName}
                  </span>
                  <span className="mx-1 text-gray-500">·</span>
                  <span className="text-sm text-gray-500">
                    {commit.commitDate
                      ? commit.commitDate.toLocaleString()
                      : "Unknown date"}
                  </span>
                </div>

                <Link
                  href={`${project?.githubUrl}/commit/${commit.commitHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-xs font-medium text-blue-600 hover:cursor-pointer hover:text-blue-800"
                  onClick={(e) => {
                    const commitUrl = `${project?.githubUrl}/commit/${commit.commitHash}`;
                    console.log("Navigating to:", commitUrl);
                    if (!project?.githubUrl || !commit.commitHash) {
                      e.preventDefault(); // Prevent navigation if the URL is incorrect
                      console.warn("Invalid commit URL");
                    }
                  }}
                >
                  View on GitHub
                  <ExternalLink className="ml-1 size-3" />
                </Link>
              </div>

              <h3 className="font-semibold text-gray-900">
                {commit.commitMessage}
              </h3>

              {commit.summary && (
                <div className="mt-2 overflow-hidden rounded-md bg-gray-50 p-3">
                  <pre className="text-sm whitespace-pre-wrap text-gray-700">
                    {commit.summary}
                  </pre>
                </div>
              )}

              {commit.commitHash && (
                <div className="mt-2 text-xs text-gray-500">
                  Hash:{" "}
                  <code className="rounded bg-gray-100 px-1 py-0.5">
                    {commit.commitHash.substring(0, 7)}
                  </code>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CommitLog;
