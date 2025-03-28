"use client";

import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { json } from "stream/consumers";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

type FormInput = {
  repoUrl: string;
  ProjectName: string;
  githubToken?: string;
};

const CreatePage = () => {
  const { register, handleSubmit, reset } = useForm<FormInput>();

  function onSubmit(data: FormInput) {
    window.alert(JSON.stringify(data, null, 2));
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
            <Button type="submit">Create Project</Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;
