import { db } from "@isp-app/db";
import { customer } from "@isp-app/db/schema/customer";
import {
  supportTicket,
  supportTicketActivity,
  supportTicketAssignment,
  supportTicketCategory,
  supportTicketChannelEnum,
  supportTicketPriorityEnum,
  supportTicketStatusEnum,
  supportTicketStatusHistory,
} from "@isp-app/db/schema/support-ticket";
import { user } from "@isp-app/db/schema/auth";
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const ticketStatusSchema = z.enum(supportTicketStatusEnum.enumValues);
const ticketPrioritySchema = z.enum(supportTicketPriorityEnum.enumValues);
const ticketChannelSchema = z.enum(supportTicketChannelEnum.enumValues);

const listInputSchema = z.object({
  query: z.string().trim().min(1).optional(),
  status: ticketStatusSchema.optional(),
  priority: ticketPrioritySchema.optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

const byIdInputSchema = z.object({
  id: z.string().trim().min(1),
});

const createInputSchema = z.object({
  customerId: z.string().trim().min(1).optional(),
  subscriptionId: z.string().trim().min(1).optional(),
  planId: z.string().trim().min(1).optional(),
  categoryId: z.string().trim().min(1).optional(),
  subject: z.string().trim().min(1),
  description: z.string().trim().min(1),
  channel: ticketChannelSchema.default("portal"),
  priority: ticketPrioritySchema.default("medium"),
  visitRequired: z.boolean().default(false),
  visitScheduledAt: z.string().trim().min(1).optional(),
  assignedTo: z.string().trim().min(1).optional(),
});

const updateInputSchema = z.object({
  id: z.string().trim().min(1),
  customerId: z.string().trim().min(1).nullable().optional(),
  subscriptionId: z.string().trim().min(1).nullable().optional(),
  planId: z.string().trim().min(1).nullable().optional(),
  categoryId: z.string().trim().min(1).nullable().optional(),
  subject: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  channel: ticketChannelSchema.optional(),
  priority: ticketPrioritySchema.optional(),
  status: ticketStatusSchema.optional(),
  visitRequired: z.boolean().optional(),
  visitScheduledAt: z.string().trim().min(1).nullable().optional(),
  assignedTo: z.string().trim().min(1).nullable().optional(),
  rootCause: z.string().trim().min(1).nullable().optional(),
  resolutionNote: z.string().trim().min(1).nullable().optional(),
  customerConfirmed: z.boolean().optional(),
});

const deleteInputSchema = z.object({
  id: z.string().trim().min(1),
});

function generateTicketNumber() {
  return `TCK-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Date.now().toString(36).toUpperCase()}`;
}

export const supportTicketRouter = router({
  list: protectedProcedure.input(listInputSchema).query(async ({ input }) => {
    const filters: SQL[] = [];

    if (input.query) {
      filters.push(
        orIlike(
          [supportTicket.ticketNumber, supportTicket.subject, supportTicket.description, customer.name, supportTicketCategory.name],
          input.query,
        ),
      );
    }
    if (input.status) {
      filters.push(eq(supportTicket.status, input.status));
    }
    if (input.priority) {
      filters.push(eq(supportTicket.priority, input.priority));
    }

    const where = filters.length ? and(...filters) : undefined;

    const [items, totalRows] = await Promise.all([
      db
        .select({
          id: supportTicket.id,
          ticketNumber: supportTicket.ticketNumber,
          customerId: supportTicket.customerId,
          customerName: customer.name,
          categoryId: supportTicket.categoryId,
          categoryName: supportTicketCategory.name,
          subject: supportTicket.subject,
          channel: supportTicket.channel,
          priority: supportTicket.priority,
          status: supportTicket.status,
          assignedTo: supportTicket.assignedTo,
          assigneeName: user.name,
          visitRequired: supportTicket.visitRequired,
          visitScheduledAt: supportTicket.visitScheduledAt,
          resolvedAt: supportTicket.resolvedAt,
          closedAt: supportTicket.closedAt,
          createdAt: supportTicket.createdAt,
          updatedAt: supportTicket.updatedAt,
        })
        .from(supportTicket)
        .leftJoin(customer, eq(supportTicket.customerId, customer.id))
        .leftJoin(supportTicketCategory, eq(supportTicket.categoryId, supportTicketCategory.id))
        .leftJoin(user, eq(supportTicket.assignedTo, user.id))
        .where(where)
        .orderBy(desc(supportTicket.createdAt))
        .limit(input.limit)
        .offset(input.offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(supportTicket)
        .leftJoin(customer, eq(supportTicket.customerId, customer.id))
        .leftJoin(supportTicketCategory, eq(supportTicket.categoryId, supportTicketCategory.id))
        .where(where)
        .then((rows) => rows[0]?.count ?? 0),
    ]);

    return {
      items,
      total: Number(totalRows),
    };
  }),

  byId: protectedProcedure.input(byIdInputSchema).query(async ({ input }) => {
    const rows = await db
      .select({
        id: supportTicket.id,
        ticketNumber: supportTicket.ticketNumber,
        customerId: supportTicket.customerId,
        customerName: customer.name,
        subscriptionId: supportTicket.subscriptionId,
        planId: supportTicket.planId,
        categoryId: supportTicket.categoryId,
        categoryName: supportTicketCategory.name,
        subject: supportTicket.subject,
        description: supportTicket.description,
        channel: supportTicket.channel,
        priority: supportTicket.priority,
        status: supportTicket.status,
        assignedTo: supportTicket.assignedTo,
        assigneeName: user.name,
        rootCause: supportTicket.rootCause,
        resolutionNote: supportTicket.resolutionNote,
        visitRequired: supportTicket.visitRequired,
        visitScheduledAt: supportTicket.visitScheduledAt,
        resolvedAt: supportTicket.resolvedAt,
        closedAt: supportTicket.closedAt,
        customerConfirmed: supportTicket.customerConfirmed,
        createdAt: supportTicket.createdAt,
        updatedAt: supportTicket.updatedAt,
      })
      .from(supportTicket)
      .leftJoin(customer, eq(supportTicket.customerId, customer.id))
      .leftJoin(supportTicketCategory, eq(supportTicket.categoryId, supportTicketCategory.id))
      .leftJoin(user, eq(supportTicket.assignedTo, user.id))
      .where(eq(supportTicket.id, input.id))
      .limit(1);

    const row = rows[0];
    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Support ticket not found",
      });
    }
    return row;
  }),

  create: protectedProcedure.input(createInputSchema).mutation(async ({ input, ctx }) => {
    const now = new Date();
    const ticketId = crypto.randomUUID();
    const inserted = await db
      .insert(supportTicket)
      .values({
        id: ticketId,
        ticketNumber: generateTicketNumber(),
        customerId: input.customerId,
        subscriptionId: input.subscriptionId,
        planId: input.planId,
        categoryId: input.categoryId,
        subject: input.subject,
        description: input.description,
        channel: input.channel,
        priority: input.priority,
        status: "open",
        assignedTo: input.assignedTo,
        visitRequired: input.visitRequired,
        visitScheduledAt: input.visitScheduledAt ? new Date(input.visitScheduledAt) : null,
      })
      .returning();

    await db.insert(supportTicketActivity).values({
      id: crypto.randomUUID(),
      ticketId,
      activityType: "created",
      note: "Ticket created",
      createdBy: ctx.session.user.id,
      createdAt: now,
    });

    await db.insert(supportTicketStatusHistory).values({
      id: crypto.randomUUID(),
      ticketId,
      oldStatus: null,
      newStatus: "open",
      changedBy: ctx.session.user.id,
      note: "Initial status",
      createdAt: now,
    });

    if (input.assignedTo) {
      await db.insert(supportTicketAssignment).values({
        id: crypto.randomUUID(),
        ticketId,
        assignedTo: input.assignedTo,
        assignedBy: ctx.session.user.id,
        assignedAt: now,
        isActive: true,
      });

      await db.insert(supportTicketActivity).values({
        id: crypto.randomUUID(),
        ticketId,
        activityType: "assigned",
        oldValue: null,
        newValue: input.assignedTo,
        note: "Ticket assigned",
        createdBy: ctx.session.user.id,
        createdAt: now,
      });
    }

    return inserted[0]!;
  }),

  update: protectedProcedure.input(updateInputSchema).mutation(async ({ input, ctx }) => {
    const currentRows = await db.select().from(supportTicket).where(eq(supportTicket.id, input.id)).limit(1);
    const current = currentRows[0];
    if (!current) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Support ticket not found",
      });
    }

    const updates: Partial<typeof supportTicket.$inferInsert> = {};
    if (input.customerId !== undefined) updates.customerId = input.customerId;
    if (input.subscriptionId !== undefined) updates.subscriptionId = input.subscriptionId;
    if (input.planId !== undefined) updates.planId = input.planId;
    if (input.categoryId !== undefined) updates.categoryId = input.categoryId;
    if (input.subject !== undefined) updates.subject = input.subject;
    if (input.description !== undefined) updates.description = input.description;
    if (input.channel !== undefined) updates.channel = input.channel;
    if (input.priority !== undefined) updates.priority = input.priority;
    if (input.status !== undefined) updates.status = input.status;
    if (input.visitRequired !== undefined) updates.visitRequired = input.visitRequired;
    if (input.visitScheduledAt !== undefined) updates.visitScheduledAt = input.visitScheduledAt ? new Date(input.visitScheduledAt) : null;
    if (input.assignedTo !== undefined) updates.assignedTo = input.assignedTo;
    if (input.rootCause !== undefined) updates.rootCause = input.rootCause;
    if (input.resolutionNote !== undefined) updates.resolutionNote = input.resolutionNote;
    if (input.customerConfirmed !== undefined) updates.customerConfirmed = input.customerConfirmed;

    if (input.status === "resolved" && current.status !== "resolved") {
      updates.resolvedAt = new Date();
    }
    if (input.status === "closed" && current.status !== "closed") {
      updates.closedAt = new Date();
    }

    if (Object.keys(updates).length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No fields to update",
      });
    }

    updates.updatedAt = new Date();
    const updatedRows = await db.update(supportTicket).set(updates).where(eq(supportTicket.id, input.id)).returning();
    const updated = updatedRows[0]!;

    if (input.status !== undefined && input.status !== current.status) {
      await db.insert(supportTicketStatusHistory).values({
        id: crypto.randomUUID(),
        ticketId: current.id,
        oldStatus: current.status,
        newStatus: input.status,
        changedBy: ctx.session.user.id,
        note: "Status updated",
      });

      await db.insert(supportTicketActivity).values({
        id: crypto.randomUUID(),
        ticketId: current.id,
        activityType: "status_changed",
        oldValue: current.status,
        newValue: input.status,
        note: "Status updated",
        createdBy: ctx.session.user.id,
      });
    } else {
      await db.insert(supportTicketActivity).values({
        id: crypto.randomUUID(),
        ticketId: current.id,
        activityType: "commented",
        note: "Ticket updated",
        createdBy: ctx.session.user.id,
      });
    }

    if (input.assignedTo !== undefined && input.assignedTo !== current.assignedTo) {
      await db
        .update(supportTicketAssignment)
        .set({ isActive: false, unassignedAt: new Date() })
        .where(and(eq(supportTicketAssignment.ticketId, current.id), eq(supportTicketAssignment.isActive, true)));

      if (input.assignedTo) {
        await db.insert(supportTicketAssignment).values({
          id: crypto.randomUUID(),
          ticketId: current.id,
          assignedTo: input.assignedTo,
          assignedBy: ctx.session.user.id,
          assignedAt: new Date(),
          isActive: true,
        });

        await db.insert(supportTicketActivity).values({
          id: crypto.randomUUID(),
          ticketId: current.id,
          activityType: "assigned",
          oldValue: current.assignedTo,
          newValue: input.assignedTo,
          note: "Ticket assigned",
          createdBy: ctx.session.user.id,
        });
      }
    }

    return updated;
  }),

  delete: protectedProcedure.input(deleteInputSchema).mutation(async ({ input }) => {
    const deleted = await db.delete(supportTicket).where(eq(supportTicket.id, input.id)).returning();
    const row = deleted[0];
    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Support ticket not found",
      });
    }
    return row;
  }),
});

function orIlike(columns: AnyPgColumn[], query: string) {
  const pattern = `%${query}%`;
  return or(...columns.map((col) => ilike(col as any, pattern))) as SQL;
}
