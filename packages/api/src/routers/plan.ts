import { db } from "@isp-app/db";
import { plan } from "@isp-app/db/schema/plan";
import { tax } from "@isp-app/db/schema/tax";
import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
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
  speedMbps: z.number().int().positive(),
  priceMonthly: z.number().int().nonnegative(),
  taxId: z.string().trim().min(1).optional(),
  isActive: z.boolean().default(true),
  description: z.string().trim().min(1).optional(),
});

const updateInputSchema = z.object({
  id: z.string().trim().min(1),
  code: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  speedMbps: z.number().int().positive().optional(),
  priceMonthly: z.number().int().nonnegative().optional(),
  taxId: z.string().trim().min(1).nullable().optional(),
  isActive: z.boolean().optional(),
  description: z.string().trim().min(1).nullable().optional(),
});

const deleteInputSchema = z.object({
  id: z.string().trim().min(1),
});

export const planRouter = router({
  listActive: protectedProcedure.query(async () => {
    const items = await db
      .select({
        id: plan.id,
        code: plan.code,
        name: plan.name,
        speedMbps: plan.speedMbps,
        priceMonthly: plan.priceMonthly,
      })
      .from(plan)
      .where(eq(plan.isActive, true))
      .orderBy(asc(plan.name));

    return {
      items,
      total: items.length,
    };
  }),

  list: protectedProcedure.input(listInputSchema).query(async ({ input }) => {
    const filters: SQL[] = [];

    if (input.query) {
      filters.push(orIlike([plan.code, plan.name, plan.description], input.query));
    }
    if (input.isActive !== undefined) {
      filters.push(eq(plan.isActive, input.isActive));
    }

    const where = filters.length ? and(...filters) : undefined;

    const [items, totalRows] = await Promise.all([
      db
        .select({
          id: plan.id,
          code: plan.code,
          name: plan.name,
          speedMbps: plan.speedMbps,
          priceMonthly: plan.priceMonthly,
          taxId: plan.taxId,
          taxName: tax.name,
          isActive: plan.isActive,
          description: plan.description,
          createdAt: plan.createdAt,
          updatedAt: plan.updatedAt,
        })
        .from(plan)
        .leftJoin(tax, eq(plan.taxId, tax.id))
        .where(where)
        .orderBy(desc(plan.createdAt))
        .limit(input.limit)
        .offset(input.offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(plan)
        .where(where)
        .then((rows) => rows[0]?.count ?? 0),
    ]);

    return {
      items,
      total: Number(totalRows),
    };
  }),

  byId: protectedProcedure.input(byIdInputSchema).query(async ({ input }) => {
    const rows = await db.select().from(plan).where(eq(plan.id, input.id)).limit(1);
    const row = rows[0];
    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Plan not found",
      });
    }
    return row;
  }),

  create: protectedProcedure.input(createInputSchema).mutation(async ({ input }) => {
    const inserted = await db
      .insert(plan)
      .values({
        id: crypto.randomUUID(),
        code: input.code,
        name: input.name,
        speedMbps: input.speedMbps,
        priceMonthly: input.priceMonthly,
        taxId: input.taxId,
        isActive: input.isActive,
        description: input.description,
      })
      .returning();

    return inserted[0]!;
  }),

  update: protectedProcedure.input(updateInputSchema).mutation(async ({ input }) => {
    const updates: Partial<typeof plan.$inferInsert> = {};

    if (input.code !== undefined) {
      updates.code = input.code;
    }
    if (input.name !== undefined) {
      updates.name = input.name;
    }
    if (input.speedMbps !== undefined) {
      updates.speedMbps = input.speedMbps;
    }
    if (input.priceMonthly !== undefined) {
      updates.priceMonthly = input.priceMonthly;
    }
    if (input.taxId !== undefined) {
      updates.taxId = input.taxId;
    }
    if (input.isActive !== undefined) {
      updates.isActive = input.isActive;
    }
    if (input.description !== undefined) {
      updates.description = input.description;
    }

    if (Object.keys(updates).length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No fields to update",
      });
    }

    updates.updatedAt = new Date();

    const updated = await db.update(plan).set(updates).where(eq(plan.id, input.id)).returning();
    const row = updated[0];
    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Plan not found",
      });
    }
    return row;
  }),

  delete: protectedProcedure.input(deleteInputSchema).mutation(async ({ input }) => {
    const deleted = await db.delete(plan).where(eq(plan.id, input.id)).returning();
    const row = deleted[0];
    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Plan not found",
      });
    }
    return row;
  }),
});

function orIlike(columns: AnyPgColumn[], query: string) {
  const pattern = `%${query}%`;
  return or(...columns.map((col) => ilike(col as any, pattern))) as SQL;
}
