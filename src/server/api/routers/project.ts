import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { projects, projectMembers, documents } from "~/server/db/schema";
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
      const [newProject] = await ctx.db
        .insert(projects)
        .values({
          name: input.name,
          description: input.description ?? "",
          createdBy: ctx.session.user.id,
        })
        .$returningId();

      if (!newProject?.id) {
        throw new Error("Failed to create project.");
      }

      await ctx.db.insert(projectMembers).values({
        projectId: newProject.id,
        userId: ctx.session.user.id,
        role: "Manager",
      });

      return { projectId: newProject.id };
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
      const manager = await ctx.db.query.projectMembers.findFirst({
        where: (fields) =>
          eq(fields.projectId, input.projectId) &&
          eq(fields.userId, ctx.session.user.id) &&
          eq(fields.role, "Manager"),
      });

      if (!manager) {
        throw new Error("Only Managers can add members to this project.");
      }

      await ctx.db.insert(projectMembers).values({
        projectId: input.projectId,
        userId: input.userId,
        role: input.role,
      });

      return { success: true };
    }),
  getProjectDetails: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.query.projects.findFirst({
        where: (fields) => eq(fields.id, input.projectId),
      });

      return project ?? null;
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
