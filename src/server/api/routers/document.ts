import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { documents } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export const documentRouter = createTRPCRouter({
  getDocument: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.select().from(documents).where(eq(documents.id, input.id));
    }),
});
