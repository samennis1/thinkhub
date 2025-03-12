import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { tasks } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";

export const taskRouter = createTRPCRouter({
  editTask: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        assignedTo: z.string().optional().nullable(),
        dueDate: z.string().optional(),
        documentIds: z.number().optional(),
        priority: z.enum(["1", "2", "3", "4", "5"]),
        status: z.enum(["To Do", "In Progress", "Completed"]),
        policyContent: z.string().optional(),
        recommendedContent: z.string().optional(),
        policyHeader: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.query.tasks.findFirst({
        where: (fields) => eq(fields.id, input.id),
        columns: { projectId: true },
      });

      if (!task) {
        throw new Error("Task not found");
      }

      const member = await ctx.db.query.projectMembers.findFirst({
        where: (fields) =>
          and(
            eq(fields.projectId, task.projectId),
            eq(fields.userId, ctx.session.user.id),
          ),
        columns: { role: true },
      });

      if (!member || !["Manager", "Researcher"].includes(member.role)) {
        throw new Error("You do not have permission to edit this task");
      }

      await ctx.db
        .update(tasks)
        .set({
          title: input.title,
          description: input.description,
          status: input.status,
          assignedTo: input.assignedTo,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          documentId: input.documentIds,
          priority: input.priority,
          policyContent: input.policyContent,
          recommendedContent: input.recommendedContent,
          policyHeader: input.policyHeader,
        })
        .where(eq(tasks.id, input.id));
    }),

  deleteTask: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.query.tasks.findFirst({
        where: (fields) => eq(fields.id, input.id),
        columns: { projectId: true },
      });

      if (!task) {
        throw new Error("Task not found");
      }

      const member = await ctx.db.query.projectMembers.findFirst({
        where: (fields) =>
          and(
            eq(fields.projectId, task.projectId),
            eq(fields.userId, ctx.session.user.id),
          ),
        columns: { role: true },
      });

      if (!member || !["Manager", "Researcher"].includes(member.role)) {
        throw new Error("You do not have permission to delete this task");
      }

      await ctx.db.delete(tasks).where(eq(tasks.id, input.id));
    }),

  getProjectTasks: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.query.projects.findFirst({
        where: (fields) => eq(fields.id, input.projectId),
        columns: { id: true, name: true },
      });

      if (!project) {
        throw new Error("Project not found");
      }

      const tasksList = await ctx.db.query.tasks.findMany({
        where: (fields) => eq(fields.projectId, input.projectId),
        columns: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          assignedTo: true,
          documentId: true,
          policyHeader: true,
          policyContent: true,
          recommendedContent: true,
        },
      });

      return {
        projectTitle: project.name,
        tasks: tasksList.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description ?? "No description provided",
          status: task.status ?? "No status",
          priority: task.priority ?? "No priority",
          assignedTo: task.assignedTo ?? "Unassigned",
          documentId: task.documentId ?? null,
          policyHeader: task.policyHeader ?? "No policy header",
          policyContent: task.policyContent ?? "No policy content",
          recommendedContent: task.recommendedContent ?? "No recommendations",
        })),
      };
    }),

  getTask: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.tasks.findFirst({
        where: (fields) => eq(fields.id, input.taskId),
      });
    }),
});
