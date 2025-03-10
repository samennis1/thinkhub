import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { projects, projectMembers, documents, users } from "~/server/db/schema";
import { eq } from "drizzle-orm";

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

  getProjects: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(projects)
      .where(eq(projects.createdBy, ctx.session.user.id));
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

    getProjectDetails: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.query.projects.findFirst({
        where: (fields) => eq(fields.id, input.projectId),
      });

      if (!project) {
        return null;
      }

      const members = await ctx.db
        .select({
          userId: projectMembers.userId,
          email: users.email,
          role: projectMembers.role,
          joinedAt: projectMembers.joinedAt,
        })
        .from(projectMembers)
        .innerJoin(users, eq(projectMembers.userId, users.id))
        .where(eq(projectMembers.projectId, input.projectId));

      const creator = await ctx.db.query.users.findFirst({
        where: (fields) => eq(fields.id, project.createdBy),
      });

      return { ...project, members, creatorEmail: creator?.email };
    }),

  assignDocument: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        fileUrl: z.string(),
        projectId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(documents).values({
        title: input.title,
        fileUrl: input.fileUrl,
        projectId: input.projectId,
        uploadedBy: ctx.session.user.id,
      });
    }),

  getDocuments: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(documents)
        .where(eq(documents.projectId, input.projectId));
    }),
});
