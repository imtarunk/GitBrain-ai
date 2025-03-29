"use client";
import { useUser } from "@clerk/nextjs";
import { ExternalLink, Github } from "lucide-react";
import useProject from "~/hooks/use-project";
import Link from "next/link";

const Dashboard = () => {
  const { user } = useUser();
  const project = useProject();

  console.log(project);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-y-4">
        {/* github link */}
        <div className="bg-primary w-fit rounded-md px-4 py-3">
          <div className="flex items-center">
            <Github className="size-5 text-white" />
            <div className="ml-2">
              <p className="text-sm font-medium text-white">
                This project is linked to{" "}
                <Link
                  href={project.project?.githubUrl ?? ""}
                  className="inline-flex items-center text-white/80 hover:underline"
                >
                  {project.project?.githubUrl}
                  <ExternalLink className="ml-2 size-4" />
                </Link>
              </p>
            </div>
          </div>
        </div>
        <div className="h4"></div>

        <div className="gp-4 flex items-center">
          TeamMember InvetarionButtion ArchiveButton
        </div>
      </div>
      <div className="mt-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          AskQuestionButtion MettingCard
        </div>
      </div>
      <div className="mt-8"></div>
      commitLog
    </div>
  );
};

export default Dashboard;
