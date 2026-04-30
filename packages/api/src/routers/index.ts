import { protectedProcedure, publicProcedure, router } from "../index";
import { customerRouter } from "./customer";
import { dashboardRouter } from "./dashboard";
import { billingCycleRouter } from "./billing-cycle";
import { invoiceRouter } from "./invoice";
import { paymentRouter } from "./payment";
import { planRouter } from "./plan";
import { paymentMethodRouter } from "./payment-method";
import { supportTicketCategoryRouter } from "./support-ticket-category";
import { supportTicketRouter } from "./support-ticket";
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
  billingCycle: billingCycleRouter,
  paymentMethod: paymentMethodRouter,
  invoice: invoiceRouter,
  payment: paymentRouter,
  tax: taxRouter,
  plan: planRouter,
  supportTicketCategory: supportTicketCategoryRouter,
  supportTicket: supportTicketRouter,
});
export type AppRouter = typeof appRouter;
