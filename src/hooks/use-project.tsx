import { api } from "~/trpc/react";
import React from "react";
import { useLocalStorage } from "usehooks-ts";

const useProject = () => {
  const {
    data: projects,
    isLoading,
    error,
  } = api.project.getProjects.useQuery();
  const [projectId, setProjectId] = useLocalStorage("gitbrain-project", "");
  const project = projects?.find((project) => project.id === projectId);

  return {
    projects,
    project,
    projectId,
    setProjectId, // Allow changing projectId
    isLoading,
    error,
  };
};

export default useProject;
