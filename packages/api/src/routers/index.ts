import { protectedProcedure, publicProcedure, router } from "../index";
import { customerRouter } from "./customer";
import { dashboardRouter } from "./dashboard";
import { subscriptionRouter } from "./subscription";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  dashboard: dashboardRouter,
  customer: customerRouter,
  subscription: subscriptionRouter,
});
export type AppRouter = typeof appRouter;
