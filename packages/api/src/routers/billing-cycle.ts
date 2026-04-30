import { db } from "@isp-app/db";
import { billingCycle } from "@isp-app/db/schema/billing";
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const listInputSchema = z.object({
  query: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

const byIdInputSchema = z.object({
  id: z.string().trim().min(1),
});

const createInputSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  dayOfMonth: z.number().int().min(1).max(31),
  graceDays: z.number().int().min(0).max(90).default(0),
  isActive: z.boolean().default(true),
});

const updateInputSchema = z.object({
  id: z.string().trim().min(1),
  code: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  graceDays: z.number().int().min(0).max(90).optional(),
  isActive: z.boolean().optional(),
});

const deleteInputSchema = z.object({
  id: z.string().trim().min(1),
});

export const billingCycleRouter = router({
  list: protectedProcedure.input(listInputSchema).query(async ({ input }) => {
    const filters: SQL[] = [];

    if (input.query) {
      filters.push(orIlike([billingCycle.code, billingCycle.name], input.query));
    }
    if (input.isActive !== undefined) {
      filters.push(eq(billingCycle.isActive, input.isActive));
    }

    const where = filters.length ? and(...filters) : undefined;

    const [items, totalRows] = await Promise.all([
      db
        .select()
        .from(billingCycle)
        .where(where)
        .orderBy(desc(billingCycle.createdAt))
        .limit(input.limit)
        .offset(input.offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(billingCycle)
        .where(where)
        .then((rows) => rows[0]?.count ?? 0),
    ]);

    return {
      items,
      total: Number(totalRows),
    };
  }),

  byId: protectedProcedure.input(byIdInputSchema).query(async ({ input }) => {
    const rows = await db.select().from(billingCycle).where(eq(billingCycle.id, input.id)).limit(1);
    const row = rows[0];
    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Billing cycle not found",
      });
    }
    return row;
  }),

  create: protectedProcedure.input(createInputSchema).mutation(async ({ input }) => {
    const inserted = await db
      .insert(billingCycle)
      .values({
        id: crypto.randomUUID(),
        code: input.code,
        name: input.name,
        dayOfMonth: input.dayOfMonth,
        graceDays: input.graceDays,
        isActive: input.isActive,
      })
      .returning();

    return inserted[0]!;
  }),

  update: protectedProcedure.input(updateInputSchema).mutation(async ({ input }) => {
    const updates: Partial<typeof billingCycle.$inferInsert> = {};

    if (input.code !== undefined) updates.code = input.code;
    if (input.name !== undefined) updates.name = input.name;
    if (input.dayOfMonth !== undefined) updates.dayOfMonth = input.dayOfMonth;
    if (input.graceDays !== undefined) updates.graceDays = input.graceDays;
    if (input.isActive !== undefined) updates.isActive = input.isActive;

    if (Object.keys(updates).length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No fields to update",
      });
    }

    updates.updatedAt = new Date();

    const updated = await db.update(billingCycle).set(updates).where(eq(billingCycle.id, input.id)).returning();
    const row = updated[0];
    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Billing cycle not found",
      });
    }
    return row;
  }),

  delete: protectedProcedure.input(deleteInputSchema).mutation(async ({ input }) => {
    const deleted = await db.delete(billingCycle).where(eq(billingCycle.id, input.id)).returning();
    const row = deleted[0];
    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Billing cycle not found",
      });
    }
    return row;
  }),
});

function orIlike(columns: AnyPgColumn[], query: string) {
  const pattern = `%${query}%`;
  return or(...columns.map((col) => ilike(col as any, pattern))) as SQL;
}
