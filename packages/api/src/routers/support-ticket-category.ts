import { db } from "@isp-app/db";
import { supportTicketCategory } from "@isp-app/db/schema/support-ticket";
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const ticketPrioritySchema = z.enum(["low", "medium", "high", "critical"]);

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
  defaultPriority: ticketPrioritySchema.default("medium"),
  isActive: z.boolean().default(true),
  description: z.string().trim().min(1).optional(),
});

const updateInputSchema = z.object({
  id: z.string().trim().min(1),
  code: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  defaultPriority: ticketPrioritySchema.optional(),
  isActive: z.boolean().optional(),
  description: z.string().trim().min(1).nullable().optional(),
});

const deleteInputSchema = z.object({
  id: z.string().trim().min(1),
});

export const supportTicketCategoryRouter = router({
  list: protectedProcedure.input(listInputSchema).query(async ({ input }) => {
    const filters: SQL[] = [];

    if (input.query) {
      filters.push(orIlike([supportTicketCategory.code, supportTicketCategory.name, supportTicketCategory.description], input.query));
    }
    if (input.isActive !== undefined) {
      filters.push(eq(supportTicketCategory.isActive, input.isActive));
    }

    const where = filters.length ? and(...filters) : undefined;

    const [items, totalRows] = await Promise.all([
      db
        .select()
        .from(supportTicketCategory)
        .where(where)
        .orderBy(desc(supportTicketCategory.createdAt))
        .limit(input.limit)
        .offset(input.offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(supportTicketCategory)
        .where(where)
        .then((rows) => rows[0]?.count ?? 0),
    ]);

    return {
      items,
      total: Number(totalRows),
    };
  }),

  byId: protectedProcedure.input(byIdInputSchema).query(async ({ input }) => {
    const rows = await db.select().from(supportTicketCategory).where(eq(supportTicketCategory.id, input.id)).limit(1);
    const row = rows[0];
    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Support ticket category not found",
      });
    }
    return row;
  }),

  create: protectedProcedure.input(createInputSchema).mutation(async ({ input }) => {
    const inserted = await db
      .insert(supportTicketCategory)
      .values({
        id: crypto.randomUUID(),
        code: input.code,
        name: input.name,
        defaultPriority: input.defaultPriority,
        isActive: input.isActive,
        description: input.description,
      })
      .returning();

    return inserted[0]!;
  }),

  update: protectedProcedure.input(updateInputSchema).mutation(async ({ input }) => {
    const updates: Partial<typeof supportTicketCategory.$inferInsert> = {};

    if (input.code !== undefined) {
      updates.code = input.code;
    }
    if (input.name !== undefined) {
      updates.name = input.name;
    }
    if (input.defaultPriority !== undefined) {
      updates.defaultPriority = input.defaultPriority;
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

    const updated = await db
      .update(supportTicketCategory)
      .set(updates)
      .where(eq(supportTicketCategory.id, input.id))
      .returning();
    const row = updated[0];
    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Support ticket category not found",
      });
    }
    return row;
  }),

  delete: protectedProcedure.input(deleteInputSchema).mutation(async ({ input }) => {
    const deleted = await db.delete(supportTicketCategory).where(eq(supportTicketCategory.id, input.id)).returning();
    const row = deleted[0];
    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Support ticket category not found",
      });
    }
    return row;
  }),
});

function orIlike(columns: AnyPgColumn[], query: string) {
  const pattern = `%${query}%`;
  return or(...columns.map((col) => ilike(col as any, pattern))) as SQL;
}
