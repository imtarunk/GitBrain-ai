"use client";

import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { json } from "stream/consumers";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";

type FormInput = {
  repoUrl: string;
  ProjectName: string;
  githubToken?: string;
};

const CreatePage = () => {
  const { register, handleSubmit, reset } = useForm<FormInput>();
  const createProject = api.project.createProject.useMutation();
  function onSubmit(data: FormInput) {
    window.alert(JSON.stringify(data, null, 2));
    createProject.mutate(
      {
        projectName: data.ProjectName,
        githubUrl: data.repoUrl,
        githubToken: data.githubToken,
      },
      {
        onSuccess: (data) => {
          toast.success(data.message);
        },
        onError: (error) => {
          toast.error("Error creating project");
        },
      },
    );
    return true;
  }

  return (
    <div className="flex h-full items-center justify-center gap-12">
      <img src="/undrow_github.svg" alt="github" className="h-56 w-auto" />
      <div>
        <div>
          <h1 className="text-2xl font-semibold">
            Link your GitHub repository
          </h1>
          <p className="text-muted-foreground text-sm">
            Entre the URL of your repository to link it to gitbrain
          </p>
        </div>
        <div className="h-4"></div>
        <div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Input
              {...register("ProjectName", { required: true })}
              placeholder="Project Name"
              required
            />
            <div className="h-4"></div>
            <Input
              {...register("repoUrl", { required: true })}
              placeholder="Github URL"
              required
            />{" "}
            <div className="h-4"></div>
            <Input
              {...register("githubToken", { required: true })}
              placeholder="Github Token (Optional)"
              required
            />{" "}
            <div className="h-4"></div>
            <Button type="submit" disabled={createProject.isPending}>
              Create Project
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;
