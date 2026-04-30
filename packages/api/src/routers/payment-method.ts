import { db } from "@isp-app/db";
import { paymentMethod, paymentMethodTypeEnum } from "@isp-app/db/schema/billing";
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const paymentMethodTypeSchema = z.enum(paymentMethodTypeEnum.enumValues);

const listInputSchema = z.object({
  query: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
  type: paymentMethodTypeSchema.optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

const byIdInputSchema = z.object({
  id: z.string().trim().min(1),
});

const createInputSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  type: paymentMethodTypeSchema.default("bank_transfer"),
  isActive: z.boolean().default(true),
});

const updateInputSchema = z.object({
  id: z.string().trim().min(1),
  code: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  type: paymentMethodTypeSchema.optional(),
  isActive: z.boolean().optional(),
});

const deleteInputSchema = z.object({
  id: z.string().trim().min(1),
});

export const paymentMethodRouter = router({
  list: protectedProcedure.input(listInputSchema).query(async ({ input }) => {
    const filters: SQL[] = [];

    if (input.query) {
      filters.push(orIlike([paymentMethod.code, paymentMethod.name], input.query));
    }
    if (input.isActive !== undefined) {
      filters.push(eq(paymentMethod.isActive, input.isActive));
    }
    if (input.type !== undefined) {
      filters.push(eq(paymentMethod.type, input.type));
    }

    const where = filters.length ? and(...filters) : undefined;

    const [items, totalRows] = await Promise.all([
      db
        .select()
        .from(paymentMethod)
        .where(where)
        .orderBy(desc(paymentMethod.createdAt))
        .limit(input.limit)
        .offset(input.offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(paymentMethod)
        .where(where)
        .then((rows) => rows[0]?.count ?? 0),
    ]);

    return {
      items,
      total: Number(totalRows),
    };
  }),

  byId: protectedProcedure.input(byIdInputSchema).query(async ({ input }) => {
    const rows = await db.select().from(paymentMethod).where(eq(paymentMethod.id, input.id)).limit(1);
    const row = rows[0];
    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Payment method not found",
      });
    }
    return row;
  }),

  create: protectedProcedure.input(createInputSchema).mutation(async ({ input }) => {
    const inserted = await db
      .insert(paymentMethod)
      .values({
        id: crypto.randomUUID(),
        code: input.code,
        name: input.name,
        type: input.type,
        isActive: input.isActive,
      })
      .returning();

    return inserted[0]!;
  }),

  update: protectedProcedure.input(updateInputSchema).mutation(async ({ input }) => {
    const updates: Partial<typeof paymentMethod.$inferInsert> = {};

    if (input.code !== undefined) updates.code = input.code;
    if (input.name !== undefined) updates.name = input.name;
    if (input.type !== undefined) updates.type = input.type;
    if (input.isActive !== undefined) updates.isActive = input.isActive;

    if (Object.keys(updates).length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No fields to update",
      });
    }

    updates.updatedAt = new Date();

    const updated = await db.update(paymentMethod).set(updates).where(eq(paymentMethod.id, input.id)).returning();
    const row = updated[0];
    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Payment method not found",
      });
    }
    return row;
  }),

  delete: protectedProcedure.input(deleteInputSchema).mutation(async ({ input }) => {
    const deleted = await db.delete(paymentMethod).where(eq(paymentMethod.id, input.id)).returning();
    const row = deleted[0];
    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Payment method not found",
      });
    }
    return row;
  }),
});

function orIlike(columns: AnyPgColumn[], query: string) {
  const pattern = `%${query}%`;
  return or(...columns.map((col) => ilike(col as any, pattern))) as SQL;
}
