//make roots for project
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { projects, projectMembers } from "~/server/db/schema";

export const projectRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(projects).values({
        name: input.name,
        description: input.description ?? "",
        createdBy: ctx.session.user.id,
      });
    }),

  addMember: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        userId: z.string(),
        role: z.enum(["Manager", "Researcher", "Viewer"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(projectMembers).values({
        projectId: input.projectId,
        userId: input.userId,
        role: input.role,
      });
    }),

  getProjects: protectedProcedure
    .input(
      z.object({
        userID: z.string(),
      }),
    )

    .query(async ({ ctx, input }) => {
      const userProjects = await ctx.db.query.projects.findMany({
        where: (project, { eq }) => eq(project.createdBy, input.userID),
      });
  
      return userProjects;
    }),

});
