import { pollCommits } from "~/lib/github";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import { indexGitRepo } from "~/lib/github-loader";

export const projectRouter = createTRPCRouter({
  createProject: protectedProcedure
    .input(
      z.object({
        projectName: z.string().min(1, "Project name is required"),
        githubUrl: z.string(),
        githubToken: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.projects.create({
        data: {
          projectName: input.projectName,
          githubUrl: input.githubUrl,
          UserToProject: {
            create: {
              userId: ctx.user.userId!,
            },
          },
        },
      });

      await pollCommits(project.id);
      await indexGitRepo(project.id, input.githubUrl, input.githubToken);

      return {
        success: true,
        message: "Project created successfully",
        project,
      };
    }),
  getProjects: protectedProcedure.query(async ({ ctx }) => {
    const projects = await ctx.db.projects.findMany({
      where: {
        UserToProject: {
          some: {
            userId: ctx.user.userId!,
          },
        },
        deletedAt: null, // filter out deleted projects
      },
    });
    return projects;
  }),
  getCommits: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, "Project ID is required"),
      }),
    )
    .query(async ({ ctx, input }) => {
      pollCommits(input.projectId).then().catch(console.error);
      return await ctx.db.commit.findMany({
        where: {
          projectId: input.projectId,
        },
      });
    }),
  saveAnswers: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, "Project ID is required"),
        question: z.string().min(1, "Question is required"),
        answer: z.string().min(1, "Answer is required"),
        fileReferences: z.array(
          z.object({
            fileName: z.string(),
            sourceCode: z.string(),
            summary: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Create the question with the answer and file references
        const question = await ctx.db.question.create({
          data: {
            question: input.question,
            answer: input.answer,
            projectId: input.projectId,
            userId: ctx.user.userId!,
            fileRef: input.fileReferences as any, // Type assertion needed for Json field
          },
        });

        return {
          success: true,
          message: "Answer and file references saved successfully",
          question,
        };
      } catch (error) {
        console.error("Error saving answer and file references:", error);
        throw new Error("Failed to save answer and file references");
      }
    }),
  getQuestions: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, "Project ID is required"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const questions = await ctx.db.question.findMany({
        where: {
          projectId: input.projectId,
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      return questions;
    }),
});
