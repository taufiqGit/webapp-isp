import { db } from "@isp-app/db";
import { billingCycle, invoice } from "@isp-app/db/schema/billing";
import { customer } from "@isp-app/db/schema/customer";
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const invoiceStatusSchema = z.enum(["draft", "issued", "partial", "paid", "overdue", "cancelled", "void"]);

const listInputSchema = z.object({
  query: z.string().trim().min(1).optional(),
  status: invoiceStatusSchema.optional(),
  customerId: z.string().trim().min(1).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

const byIdInputSchema = z.object({
  id: z.string().trim().min(1),
});

const createInputSchema = z.object({
  customerId: z.string().trim().min(1),
  subscriptionId: z.string().trim().min(1).optional(),
  planId: z.string().trim().min(1).optional(),
  billingCycleId: z.string().trim().min(1).optional(),
  billingPeriodStart: z.string().trim().min(1),
  billingPeriodEnd: z.string().trim().min(1),
  issueDate: z.string().trim().min(1),
  dueDate: z.string().trim().min(1),
  subtotal: z.number().int().nonnegative().default(0),
  taxAmount: z.number().int().nonnegative().default(0),
  discountAmount: z.number().int().nonnegative().default(0),
  notes: z.string().trim().min(1).optional(),
  status: invoiceStatusSchema.default("draft"),
});

const updateInputSchema = z.object({
  id: z.string().trim().min(1),
  customerId: z.string().trim().min(1).optional(),
  subscriptionId: z.string().trim().min(1).nullable().optional(),
  planId: z.string().trim().min(1).nullable().optional(),
  billingCycleId: z.string().trim().min(1).nullable().optional(),
  billingPeriodStart: z.string().trim().min(1).optional(),
  billingPeriodEnd: z.string().trim().min(1).optional(),
  issueDate: z.string().trim().min(1).optional(),
  dueDate: z.string().trim().min(1).optional(),
  subtotal: z.number().int().nonnegative().optional(),
  taxAmount: z.number().int().nonnegative().optional(),
  discountAmount: z.number().int().nonnegative().optional(),
  paidAmount: z.number().int().nonnegative().optional(),
  status: invoiceStatusSchema.optional(),
  notes: z.string().trim().min(1).nullable().optional(),
});

const deleteInputSchema = z.object({
  id: z.string().trim().min(1),
});

function generateInvoiceNumber() {
  return `INV-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Date.now().toString(36).toUpperCase()}`;
}

function computeTotal(subtotal: number, taxAmount: number, discountAmount: number) {
  return Math.max(0, subtotal + taxAmount - discountAmount);
}

export const invoiceRouter = router({
  list: protectedProcedure.input(listInputSchema).query(async ({ input }) => {
    const filters: SQL[] = [];

    if (input.query) {
      filters.push(orIlike([invoice.invoiceNumber, customer.name], input.query));
    }
    if (input.status) {
      filters.push(eq(invoice.status, input.status));
    }
    if (input.customerId) {
      filters.push(eq(invoice.customerId, input.customerId));
    }

    const where = filters.length ? and(...filters) : undefined;

    const [items, totalRows] = await Promise.all([
      db
        .select({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          customerId: invoice.customerId,
          customerName: customer.name,
          billingCycleId: invoice.billingCycleId,
          billingCycleName: billingCycle.name,
          billingPeriodStart: invoice.billingPeriodStart,
          billingPeriodEnd: invoice.billingPeriodEnd,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          subtotal: invoice.subtotal,
          taxAmount: invoice.taxAmount,
          discountAmount: invoice.discountAmount,
          totalAmount: invoice.totalAmount,
          paidAmount: invoice.paidAmount,
          balanceAmount: invoice.balanceAmount,
          status: invoice.status,
          createdAt: invoice.createdAt,
          updatedAt: invoice.updatedAt,
        })
        .from(invoice)
        .leftJoin(customer, eq(invoice.customerId, customer.id))
        .leftJoin(billingCycle, eq(invoice.billingCycleId, billingCycle.id))
        .where(where)
        .orderBy(desc(invoice.createdAt))
        .limit(input.limit)
        .offset(input.offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(invoice)
        .leftJoin(customer, eq(invoice.customerId, customer.id))
        .where(where)
        .then((rows) => rows[0]?.count ?? 0),
    ]);

    return {
      items,
      total: Number(totalRows),
    };
  }),

  byId: protectedProcedure.input(byIdInputSchema).query(async ({ input }) => {
    const rows = await db.select().from(invoice).where(eq(invoice.id, input.id)).limit(1);
    const row = rows[0];
    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invoice not found",
      });
    }
    return row;
  }),

  create: protectedProcedure.input(createInputSchema).mutation(async ({ input }) => {
    const totalAmount = computeTotal(input.subtotal, input.taxAmount, input.discountAmount);
    const paidAmount = 0;
    const balanceAmount = totalAmount;

    const inserted = await db
      .insert(invoice)
      .values({
        id: crypto.randomUUID(),
        invoiceNumber: generateInvoiceNumber(),
        customerId: input.customerId,
        subscriptionId: input.subscriptionId,
        planId: input.planId,
        billingCycleId: input.billingCycleId,
        billingPeriodStart: input.billingPeriodStart,
        billingPeriodEnd: input.billingPeriodEnd,
        issueDate: input.issueDate,
        dueDate: input.dueDate,
        subtotal: input.subtotal,
        taxAmount: input.taxAmount,
        discountAmount: input.discountAmount,
        totalAmount,
        paidAmount,
        balanceAmount,
        status: input.status,
        notes: input.notes,
        issuedAt: input.status === "issued" ? new Date() : null,
      })
      .returning();

    return inserted[0]!;
  }),

  update: protectedProcedure.input(updateInputSchema).mutation(async ({ input }) => {
    const rows = await db.select().from(invoice).where(eq(invoice.id, input.id)).limit(1);
    const current = rows[0];
    if (!current) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invoice not found",
      });
    }

    const updates: Partial<typeof invoice.$inferInsert> = {};
    if (input.customerId !== undefined) updates.customerId = input.customerId;
    if (input.subscriptionId !== undefined) updates.subscriptionId = input.subscriptionId;
    if (input.planId !== undefined) updates.planId = input.planId;
    if (input.billingCycleId !== undefined) updates.billingCycleId = input.billingCycleId;
    if (input.billingPeriodStart !== undefined) updates.billingPeriodStart = input.billingPeriodStart;
    if (input.billingPeriodEnd !== undefined) updates.billingPeriodEnd = input.billingPeriodEnd;
    if (input.issueDate !== undefined) updates.issueDate = input.issueDate;
    if (input.dueDate !== undefined) updates.dueDate = input.dueDate;
    if (input.subtotal !== undefined) updates.subtotal = input.subtotal;
    if (input.taxAmount !== undefined) updates.taxAmount = input.taxAmount;
    if (input.discountAmount !== undefined) updates.discountAmount = input.discountAmount;
    if (input.notes !== undefined) updates.notes = input.notes;

    const nextSubtotal = input.subtotal ?? current.subtotal;
    const nextTax = input.taxAmount ?? current.taxAmount;
    const nextDiscount = input.discountAmount ?? current.discountAmount;
    const totalAmount = computeTotal(nextSubtotal, nextTax, nextDiscount);
    const paidAmount = input.paidAmount ?? current.paidAmount;
    const balanceAmount = Math.max(0, totalAmount - paidAmount);

    updates.totalAmount = totalAmount;
    updates.paidAmount = paidAmount;
    updates.balanceAmount = balanceAmount;

    let nextStatus = input.status ?? current.status;
    if (nextStatus !== "cancelled" && nextStatus !== "void") {
      if (balanceAmount <= 0) nextStatus = "paid";
      else if (paidAmount > 0) nextStatus = "partial";
    }
    updates.status = nextStatus;

    if (nextStatus === "issued" && !current.issuedAt) updates.issuedAt = new Date();
    if (nextStatus === "paid" && !current.paidAt) updates.paidAt = new Date();
    if ((nextStatus === "cancelled" || nextStatus === "void") && !current.cancelledAt) updates.cancelledAt = new Date();

    updates.updatedAt = new Date();

    const updated = await db.update(invoice).set(updates).where(eq(invoice.id, input.id)).returning();
    return updated[0]!;
  }),

  delete: protectedProcedure.input(deleteInputSchema).mutation(async ({ input }) => {
    const deleted = await db.delete(invoice).where(eq(invoice.id, input.id)).returning();
    const row = deleted[0];
    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invoice not found",
      });
    }
    return row;
  }),
});

function orIlike(columns: AnyPgColumn[], query: string) {
  const pattern = `%${query}%`;
  return or(...columns.map((col) => ilike(col as any, pattern))) as SQL;
}
