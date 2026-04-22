import { db } from "@isp-app/db";
import { tax } from "@isp-app/db/schema/tax";
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const listInputSchema = z.object({
  query: z.string().trim().min(1).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

const byIdInputSchema = z.object({
  id: z.string().trim().min(1),
});

const createInputSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  rate: z.number().min(0).max(100),
  description: z.string().trim().min(1).optional(),
});

const updateInputSchema = z.object({
  id: z.string().trim().min(1),
  code: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  rate: z.number().min(0).max(100).optional(),
  description: z.string().trim().min(1).nullable().optional(),
});

const deleteInputSchema = z.object({
  id: z.string().trim().min(1),
});

export const taxRouter = router({
  list: protectedProcedure.input(listInputSchema).query(async ({ input }) => {
    const filters: SQL[] = [];

    if (input.query) {
      filters.push(orIlike([tax.code, tax.name, tax.description], input.query));
    }

    const where = filters.length ? and(...filters) : undefined;

    const [items, totalRows] = await Promise.all([
      db.select().from(tax).where(where).orderBy(desc(tax.createdAt)).limit(input.limit).offset(input.offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(tax)
        .where(where)
        .then((rows) => rows[0]?.count ?? 0),
    ]);

    return {
      items,
      total: Number(totalRows),
    };
  }),

  byId: protectedProcedure.input(byIdInputSchema).query(async ({ input }) => {
    const rows = await db.select().from(tax).where(eq(tax.id, input.id)).limit(1);
    const row = rows[0];
    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Tax not found",
      });
    }
    return row;
  }),

  create: protectedProcedure.input(createInputSchema).mutation(async ({ input }) => {
    const inserted = await db
      .insert(tax)
      .values({
        id: crypto.randomUUID(),
        code: input.code,
        name: input.name,
        rate: input.rate.toFixed(2),
        description: input.description,
      })
      .returning();

    return inserted[0]!;
  }),

  update: protectedProcedure.input(updateInputSchema).mutation(async ({ input }) => {
    const updates: Partial<typeof tax.$inferInsert> = {};

    if (input.code !== undefined) {
      updates.code = input.code;
    }
    if (input.name !== undefined) {
      updates.name = input.name;
    }
    if (input.rate !== undefined) {
      updates.rate = input.rate.toFixed(2);
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

    const updated = await db.update(tax).set(updates).where(eq(tax.id, input.id)).returning();
    const row = updated[0];

    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Tax not found",
      });
    }

    return row;
  }),

  delete: protectedProcedure.input(deleteInputSchema).mutation(async ({ input }) => {
    const deleted = await db.delete(tax).where(eq(tax.id, input.id)).returning();
    const row = deleted[0];
    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Tax not found",
      });
    }
    return row;
  }),
});

function orIlike(columns: AnyPgColumn[], query: string) {
  const pattern = `%${query}%`;
  return or(...columns.map((col) => ilike(col as any, pattern))) as SQL;
}
