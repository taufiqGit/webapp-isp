import { db } from "@isp-app/db";
import { customer } from "@isp-app/db/schema/customer";
import { customerSubscription } from "@isp-app/db/schema/subscription";
import { and, desc, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const subscriptionStatusSchema = z.enum(["active", "suspended", "terminated"]);

const listByCustomerInputSchema = z.object({
  customerId: z.string().trim().min(1),
});

const createInputSchema = z.object({
  customerId: z.string().trim().min(1),
  packageId: z.string().trim().min(1),
  packageName: z.string().trim().min(1),
  startDate: z.string().trim().min(1).optional(),
  priceMonthly: z.number().int().nonnegative().optional(),
});

const setStatusInputSchema = z.object({
  id: z.string().trim().min(1),
  status: subscriptionStatusSchema,
});

const deleteInputSchema = z.object({
  id: z.string().trim().min(1),
});

async function recomputeCustomerStatus(customerId: string) {
  const [customerRow] = await db.select().from(customer).where(eq(customer.id, customerId)).limit(1);
  if (!customerRow) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Customer not found",
    });
  }

  const subscriptions = await db
    .select({ status: customerSubscription.status, endDate: customerSubscription.endDate, priceMonthly: customerSubscription.priceMonthly })
    .from(customerSubscription)
    .where(eq(customerSubscription.customerId, customerId));

  const hasActive = subscriptions.some((sub) => sub.status === "active");
  const hasSuspended = subscriptions.some((sub) => sub.status === "suspended");
  const hasAny = subscriptions.length > 0;
  const activeCount = subscriptions.filter((sub) => sub.status === "active").length;
  const totalSubscriptionCost = subscriptions
    .filter((sub) => sub.status === "active")
    .reduce((sum, sub) => sum + (sub.priceMonthly || 0), 0);

  // Calculate next payment date (earliest end date among active subscriptions)
  const activeEndDates = subscriptions
    .filter((sub) => sub.status === "active" && sub.endDate)
    .map((sub) => sub.endDate!)
    .sort((a, b) => a.getTime() - b.getTime());
  
  const nextPaymentDate = activeEndDates.length > 0 ? activeEndDates[0] : null;

  let nextStatus: "prospect" | "active" | "suspended" | "terminated" = customerRow.status;

  if (hasActive) {
    nextStatus = "active";
  } else if (customerRow.status === "terminated") {
    nextStatus = "terminated";
  } else if (hasSuspended) {
    nextStatus = "suspended";
  } else if (!hasAny) {
    nextStatus = customerRow.status === "prospect" ? "prospect" : "suspended";
  } else {
    nextStatus = "suspended";
  }

  const updates: any = {
    status: nextStatus,
    totalActiveSubscriptions: activeCount,
    totalSubscriptionCost,
    updatedAt: new Date(),
  };

  if (nextPaymentDate) {
    updates.nextPaymentDate = nextPaymentDate;
  } else {
    updates.nextPaymentDate = null;
  }

  const [updated] = await db
    .update(customer)
    .set(updates)
    .where(eq(customer.id, customerId))
    .returning();
  
  return updated!;
}

export const subscriptionRouter = router({
  listByCustomer: protectedProcedure.input(listByCustomerInputSchema).query(async ({ input }) => {
    const items = await db
      .select()
      .from(customerSubscription)
      .where(eq(customerSubscription.customerId, input.customerId))
      .orderBy(desc(customerSubscription.createdAt));

    return { items };
  }),

  create: protectedProcedure.input(createInputSchema).mutation(async ({ input }) => {
    const id = crypto.randomUUID();
    const startDate = input.startDate ? new Date(input.startDate) : new Date();

    // Set end date to 10th of next month from start date at 23:00
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(10);
    endDate.setHours(23, 0, 0, 0);

    const inserted = await db
      .insert(customerSubscription)
      .values({
        id,
        customerId: input.customerId,
        packageId: input.packageId,
        packageName: input.packageName,
        status: "active",
        startDate,
        endDate,
        priceMonthly: input.priceMonthly,
      })
      .returning();

    const updatedCustomer = await recomputeCustomerStatus(input.customerId);

    return {
      subscription: inserted[0]!,
      customer: updatedCustomer,
    };
  }),

  setStatus: protectedProcedure.input(setStatusInputSchema).mutation(async ({ input }) => {
    const rows = await db.select().from(customerSubscription).where(eq(customerSubscription.id, input.id)).limit(1);
    const row = rows[0];
    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Subscription not found",
      });
    }

    const nextEndDate = input.status === "terminated" ? new Date() : null;

    const updated = await db
      .update(customerSubscription)
      .set({
        status: input.status,
        endDate: nextEndDate,
        updatedAt: new Date(),
      })
      .where(eq(customerSubscription.id, input.id))
      .returning();

    const updatedCustomer = await recomputeCustomerStatus(row.customerId);

    return {
      subscription: updated[0]!,
      customer: updatedCustomer,
    };
  }),

  delete: protectedProcedure.input(deleteInputSchema).mutation(async ({ input }) => {
    const rows = await db.select().from(customerSubscription).where(eq(customerSubscription.id, input.id)).limit(1);
    const row = rows[0];
    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Subscription not found",
      });
    }

    if (row.status === "active") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Active subscription cannot be deleted",
      });
    }

    const deleted = await db.delete(customerSubscription).where(eq(customerSubscription.id, input.id)).returning();
    const updatedCustomer = await recomputeCustomerStatus(row.customerId);

    return {
      subscription: deleted[0]!,
      customer: updatedCustomer,
    };
  }),

  clearByCustomer: protectedProcedure.input(listByCustomerInputSchema).mutation(async ({ input }) => {
    const activeCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(customerSubscription)
      .where(and(eq(customerSubscription.customerId, input.customerId), eq(customerSubscription.status, "active")))
      .then((result) => Number(result[0]?.count ?? 0));

    if (activeCount > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Customer still has active subscriptions",
      });
    }

    await db.delete(customerSubscription).where(eq(customerSubscription.customerId, input.customerId));
    const updatedCustomer = await recomputeCustomerStatus(input.customerId);

    return {
      customer: updatedCustomer,
    };
  }),
});
