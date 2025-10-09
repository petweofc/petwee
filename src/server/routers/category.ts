import { router, publicProcedure } from '../trpc';
import { z } from 'zod';

export const categoryRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.prisma.category.findMany({
      select: { id: true, name: true }
    });
    return categories;
  }),

  get: publicProcedure.input(z.object({ id: z.number().min(1) })).query(async ({ input, ctx }) => {
    const category = await ctx.prisma.category.findUnique({
      where: { id: input.id },
      select: { id: true, name: true }
    });
    return category;
  })
});

export type CategoryRouter = typeof categoryRouter;