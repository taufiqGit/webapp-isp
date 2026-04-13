import { db } from "@isp-app/db";
import { customer } from "@isp-app/db/schema/customer";
import { customerSubscription } from "@isp-app/db/schema/subscription";
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const customerTypeSchema = z.enum(["individual", "business"]);
const customerStatusSchema = z.enum(["prospect", "active", "suspended", "terminated"]);
const customerIdentityTypeSchema = z.enum(["ktp", "sim", "passport", "npwp", "other"]);

const listInputSchema = z.object({
  query: z.string().trim().min(1).optional(),
  status: customerStatusSchema.optional(),
  type: customerTypeSchema.optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

const createInputSchema = z.object({
  customerNumber: z.string().trim().min(1).optional(),
  type: customerTypeSchema.default("individual"),
  name: z.string().trim().min(1),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(1).optional(),
  identityType: customerIdentityTypeSchema.optional(),
  identityNumber: z.string().trim().min(1).optional(),
  birthDate: z.string().trim().min(1).optional(),
  taxId: z.string().trim().min(1).optional(),
  notes: z.string().trim().min(1).optional(),
});

const updateInputSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1).optional(),
  type: customerTypeSchema.optional(),
  email: z.string().trim().email().nullable().optional(),
  phone: z.string().trim().min(1).nullable().optional(),
});

const byIdInputSchema = z.object({
  id: z.string().trim().min(1),
});

const deleteInputSchema = z.object({
  id: z.string().trim().min(1),
});

const setTerminatedInputSchema = z.object({
  id: z.string().trim().min(1),
});

function generateCustomerNumber() {
  return `CUS-${Date.now().toString(36).toUpperCase()}`;
}

export const customerRouter = router({
  list: protectedProcedure.input(listInputSchema).query(async ({ input }) => {
    const filters: SQL[] = [];

    if (input.query) {
      filters.push(
        orIlike(
          [
            customer.customerNumber,
            customer.name,
            customer.email,
            customer.phone,
            customer.identityNumber,
          ],
          input.query,
        ),
      );
    }

    if (input.status) {
      filters.push(eq(customer.status, input.status));
    }

    if (input.type) {
      filters.push(eq(customer.type, input.type));
    }

    const where = filters.length ? and(...filters) : undefined;

    const [items, totalRows] = await Promise.all([
      db
        .select()
        .from(customer)
        .where(where)
        .orderBy(desc(customer.createdAt))
        .limit(input.limit)
        .offset(input.offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(customer)
        .where(where)
        .then((rows) => rows[0]?.count ?? 0),
    ]);

    return {
      items,
      total: Number(totalRows),
    };
  }),

  byId: protectedProcedure.input(byIdInputSchema).query(async ({ input }) => {
    const rows = await db.select().from(customer).where(eq(customer.id, input.id)).limit(1);
    const row = rows[0];
    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Customer not found",
      });
    }
    return row;
  }),

  create: protectedProcedure.input(createInputSchema).mutation(async ({ input }) => {
    const id = crypto.randomUUID();
    const customerNumber = input.customerNumber ?? generateCustomerNumber();

    const inserted = await db
      .insert(customer)
      .values({
        id,
        customerNumber,
        type: input.type,
        status: "prospect",
        name: input.name,
        email: input.email,
        phone: input.phone,
        identityType: input.identityType,
        identityNumber: input.identityNumber,
        birthDate: input.birthDate,
        taxId: input.taxId,
        notes: input.notes,
      })
      .returning();

    return inserted[0]!;
  }),

  update: protectedProcedure.input(updateInputSchema).mutation(async ({ input }) => {
    const updates: Partial<typeof customer.$inferInsert> = {};

    if (input.name !== undefined) {
      updates.name = input.name;
    }
    if (input.type !== undefined) {
      updates.type = input.type;
    }
    if (input.email !== undefined) {
      updates.email = input.email;
    }
    if (input.phone !== undefined) {
      updates.phone = input.phone;
    }

    if (Object.keys(updates).length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No fields to update",
      });
    }

    updates.updatedAt = new Date();

    const updated = await db
      .update(customer)
      .set(updates)
      .where(eq(customer.id, input.id))
      .returning();

    const row = updated[0];
    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Customer not found",
      });
    }

    return row;
  }),

  setTerminated: protectedProcedure.input(setTerminatedInputSchema).mutation(async ({ input }) => {
    const rows = await db.select().from(customer).where(eq(customer.id, input.id)).limit(1);
    const row = rows[0];
    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Customer not found",
      });
    }
    if (row.status !== "suspended") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Customer must be suspended before terminated",
      });
    }

    const activeCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(customerSubscription)
      .where(and(eq(customerSubscription.customerId, input.id), eq(customerSubscription.status, "active")))
      .then((result) => Number(result[0]?.count ?? 0));

    if (activeCount > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Customer still has active subscriptions",
      });
    }

    const updated = await db
      .update(customer)
      .set({ status: "terminated", updatedAt: new Date() })
      .where(eq(customer.id, input.id))
      .returning();

    return updated[0]!;
  }),

  delete: protectedProcedure.input(deleteInputSchema).mutation(async ({ input }) => {
    const rows = await db.select().from(customer).where(eq(customer.id, input.id)).limit(1);
    const row = rows[0];
    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Customer not found",
      });
    }
    if (row.status !== "terminated") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Only terminated customers can be deleted",
      });
    }

    const deleted = await db.delete(customer).where(eq(customer.id, input.id)).returning();
    return deleted[0]!;
  }),
});

function orIlike(columns: AnyPgColumn[], query: string) {
  const pattern = `%${query}%`;
  return or(...columns.map((col) => ilike(col as any, pattern))) as SQL;
}
