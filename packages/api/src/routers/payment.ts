import { db } from "@isp-app/db";
import { invoice, payment, paymentAllocation, paymentMethod, paymentStatusEnum } from "@isp-app/db/schema/billing";
import { customer } from "@isp-app/db/schema/customer";
import { and, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const paymentStatusSchema = z.enum(paymentStatusEnum.enumValues);

const listInputSchema = z.object({
  query: z.string().trim().min(1).optional(),
  status: paymentStatusSchema.optional(),
  customerId: z.string().trim().min(1).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

const byIdInputSchema = z.object({
  id: z.string().trim().min(1),
});

const paymentAllocationInputSchema = z.object({
  invoiceId: z.string().trim().min(1),
  allocatedAmount: z.number().int().positive(),
});

const createInputSchema = z.object({
  customerId: z.string().trim().min(1),
  paymentMethodId: z.string().trim().min(1).optional(),
  paymentDate: z.string().trim().min(1).optional(),
  amount: z.number().int().positive(),
  status: paymentStatusSchema.default("paid"),
  referenceNumber: z.string().trim().min(1).optional(),
  notes: z.string().trim().min(1).optional(),
  proofUrl: z.string().trim().min(1).optional(),
  allocations: z.array(paymentAllocationInputSchema).default([]),
});

const updateInputSchema = z.object({
  id: z.string().trim().min(1),
  customerId: z.string().trim().min(1).optional(),
  paymentMethodId: z.string().trim().min(1).nullable().optional(),
  paymentDate: z.string().trim().min(1).optional(),
  amount: z.number().int().positive().optional(),
  status: paymentStatusSchema.optional(),
  referenceNumber: z.string().trim().min(1).nullable().optional(),
  notes: z.string().trim().min(1).nullable().optional(),
  proofUrl: z.string().trim().min(1).nullable().optional(),
});

const deleteInputSchema = z.object({
  id: z.string().trim().min(1),
});

function generatePaymentNumber() {
  return `PAY-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Date.now().toString(36).toUpperCase()}`;
}

async function recomputeInvoicesByIds(invoiceIds: string[]) {
  if (invoiceIds.length === 0) return;

  const uniqueInvoiceIds = [...new Set(invoiceIds)];
  const allocations = await db
    .select({
      invoiceId: paymentAllocation.invoiceId,
      allocatedAmount: paymentAllocation.allocatedAmount,
    })
    .from(paymentAllocation)
    .where(inArray(paymentAllocation.invoiceId, uniqueInvoiceIds));

  const paidMap = allocations.reduce(
    (acc, item) => {
      acc[item.invoiceId] = (acc[item.invoiceId] ?? 0) + item.allocatedAmount;
      return acc;
    },
    {} as Record<string, number>,
  );

  const rows = await db.select().from(invoice).where(inArray(invoice.id, uniqueInvoiceIds));
  for (const inv of rows) {
    const paidAmount = paidMap[inv.id] ?? 0;
    const balanceAmount = Math.max(0, inv.totalAmount - paidAmount);
    const status =
      inv.status === "cancelled" || inv.status === "void"
        ? inv.status
        : balanceAmount <= 0
          ? "paid"
          : paidAmount > 0
            ? "partial"
            : inv.status === "draft"
              ? "draft"
              : "issued";

    await db
      .update(invoice)
      .set({
        paidAmount,
        balanceAmount,
        status,
        paidAt: status === "paid" ? inv.paidAt ?? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(invoice.id, inv.id));
  }
}

export const paymentRouter = router({
  list: protectedProcedure.input(listInputSchema).query(async ({ input }) => {
    const filters: SQL[] = [];
    if (input.query) {
      filters.push(orIlike([payment.paymentNumber, payment.referenceNumber, customer.name], input.query));
    }
    if (input.status) {
      filters.push(eq(payment.status, input.status));
    }
    if (input.customerId) {
      filters.push(eq(payment.customerId, input.customerId));
    }

    const where = filters.length ? and(...filters) : undefined;

    const [items, totalRows] = await Promise.all([
      db
        .select({
          id: payment.id,
          paymentNumber: payment.paymentNumber,
          customerId: payment.customerId,
          customerName: customer.name,
          paymentMethodId: payment.paymentMethodId,
          paymentMethodName: paymentMethod.name,
          paymentDate: payment.paymentDate,
          amount: payment.amount,
          status: payment.status,
          referenceNumber: payment.referenceNumber,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        })
        .from(payment)
        .leftJoin(customer, eq(payment.customerId, customer.id))
        .leftJoin(paymentMethod, eq(payment.paymentMethodId, paymentMethod.id))
        .where(where)
        .orderBy(desc(payment.createdAt))
        .limit(input.limit)
        .offset(input.offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(payment)
        .leftJoin(customer, eq(payment.customerId, customer.id))
        .where(where)
        .then((rows) => rows[0]?.count ?? 0),
    ]);

    return {
      items,
      total: Number(totalRows),
    };
  }),

  byId: protectedProcedure.input(byIdInputSchema).query(async ({ input }) => {
    const rows = await db.select().from(payment).where(eq(payment.id, input.id)).limit(1);
    const row = rows[0];
    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Payment not found",
      });
    }

    const allocations = await db
      .select({
        id: paymentAllocation.id,
        paymentId: paymentAllocation.paymentId,
        invoiceId: paymentAllocation.invoiceId,
        allocatedAmount: paymentAllocation.allocatedAmount,
      })
      .from(paymentAllocation)
      .where(eq(paymentAllocation.paymentId, row.id));

    return {
      ...row,
      allocations,
    };
  }),

  create: protectedProcedure.input(createInputSchema).mutation(async ({ input, ctx }) => {
    const allocatedTotal = input.allocations.reduce((sum, item) => sum + item.allocatedAmount, 0);
    if (allocatedTotal > input.amount) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Allocated amount cannot exceed payment amount",
      });
    }

    const inserted = await db
      .insert(payment)
      .values({
        id: crypto.randomUUID(),
        paymentNumber: generatePaymentNumber(),
        customerId: input.customerId,
        paymentMethodId: input.paymentMethodId,
        paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
        amount: input.amount,
        status: input.status,
        referenceNumber: input.referenceNumber,
        notes: input.notes,
        proofUrl: input.proofUrl,
        receivedBy: ctx.session.user.id,
      })
      .returning();

    const created = inserted[0]!;

    if (input.allocations.length > 0) {
      await db.insert(paymentAllocation).values(
        input.allocations.map((item) => ({
          id: crypto.randomUUID(),
          paymentId: created.id,
          invoiceId: item.invoiceId,
          allocatedAmount: item.allocatedAmount,
        })),
      );
      await recomputeInvoicesByIds(input.allocations.map((item) => item.invoiceId));
    }

    return created;
  }),

  update: protectedProcedure.input(updateInputSchema).mutation(async ({ input }) => {
    const updates: Partial<typeof payment.$inferInsert> = {};
    if (input.customerId !== undefined) updates.customerId = input.customerId;
    if (input.paymentMethodId !== undefined) updates.paymentMethodId = input.paymentMethodId;
    if (input.paymentDate !== undefined) updates.paymentDate = new Date(input.paymentDate);
    if (input.amount !== undefined) updates.amount = input.amount;
    if (input.status !== undefined) updates.status = input.status;
    if (input.referenceNumber !== undefined) updates.referenceNumber = input.referenceNumber;
    if (input.notes !== undefined) updates.notes = input.notes;
    if (input.proofUrl !== undefined) updates.proofUrl = input.proofUrl;

    if (Object.keys(updates).length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No fields to update",
      });
    }

    updates.updatedAt = new Date();

    const updated = await db.update(payment).set(updates).where(eq(payment.id, input.id)).returning();
    const row = updated[0];
    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Payment not found",
      });
    }

    return row;
  }),

  delete: protectedProcedure.input(deleteInputSchema).mutation(async ({ input }) => {
    const allocations = await db
      .select({ invoiceId: paymentAllocation.invoiceId })
      .from(paymentAllocation)
      .where(eq(paymentAllocation.paymentId, input.id));

    const deleted = await db.delete(payment).where(eq(payment.id, input.id)).returning();
    const row = deleted[0];
    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Payment not found",
      });
    }

    await recomputeInvoicesByIds(allocations.map((item) => item.invoiceId));

    return row;
  }),
});

function orIlike(columns: AnyPgColumn[], query: string) {
  const pattern = `%${query}%`;
  return or(...columns.map((col) => ilike(col as any, pattern))) as SQL;
}
