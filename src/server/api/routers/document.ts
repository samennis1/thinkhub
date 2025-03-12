import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { eq } from "drizzle-orm";

export const documentRouter = createTRPCRouter({
  getDocument: protectedProcedure
    .input(z.object({ documentId: z.number().nullable() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.documents.findFirst({
        where: (fields) =>
          input.documentId !== null
            ? eq(fields.id, input.documentId)
            : undefined,
      });
    }),
});
