import { protectedProcedure, publicProcedure, router } from "../index";
import { customerRouter } from "./customer";
import { dashboardRouter } from "./dashboard";
import { planRouter } from "./plan";
import { subscriptionRouter } from "./subscription";
import { taxRouter } from "./tax";

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
  tax: taxRouter,
  plan: planRouter,
});
export type AppRouter = typeof appRouter;
