import { relations } from "drizzle-orm";
import { boolean, index, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { customer } from "./customer";
import { plan } from "./plan";
import { customerSubscription } from "./subscription";

export const supportTicketStatusEnum = pgEnum("support_ticket_status", [
  "open",
  "assigned",
  "on_progress",
  "pending_customer",
  "pending_internal",
  "resolved",
  "closed",
  "cancelled",
]);

export const supportTicketPriorityEnum = pgEnum("support_ticket_priority", ["low", "medium", "high", "critical"]);

export const supportTicketChannelEnum = pgEnum("support_ticket_channel", ["phone", "whatsapp", "portal", "email", "walkin"]);

export const supportTicketActivityTypeEnum = pgEnum("support_ticket_activity_type", [
  "created",
  "assigned",
  "status_changed",
  "commented",
  "resolved",
  "closed",
  "reopened",
]);

export const supportTicketCategory = pgTable(
  "support_ticket_category",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    defaultPriority: supportTicketPriorityEnum("default_priority").notNull().default("medium"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("supportTicketCategory_code_uq").on(table.code),
    uniqueIndex("supportTicketCategory_name_uq").on(table.name),
    index("supportTicketCategory_isActive_idx").on(table.isActive),
  ],
);

export const supportTicket = pgTable(
  "support_ticket",
  {
    id: text("id").primaryKey(),
    ticketNumber: text("ticket_number").notNull(),
    customerId: text("customer_id").references(() => customer.id, { onDelete: "set null" }),
    subscriptionId: text("subscription_id").references(() => customerSubscription.id, { onDelete: "set null" }),
    planId: text("plan_id").references(() => plan.id, { onDelete: "set null" }),
    categoryId: text("category_id").references(() => supportTicketCategory.id, { onDelete: "set null" }),
    subject: text("subject").notNull(),
    description: text("description").notNull(),
    channel: supportTicketChannelEnum("channel").notNull().default("portal"),
    priority: supportTicketPriorityEnum("priority").notNull().default("medium"),
    status: supportTicketStatusEnum("status").notNull().default("open"),
    assignedTo: text("assigned_to").references(() => user.id, { onDelete: "set null" }),
    rootCause: text("root_cause"),
    resolutionNote: text("resolution_note"),
    visitRequired: boolean("visit_required").notNull().default(false),
    visitScheduledAt: timestamp("visit_scheduled_at"),
    resolvedAt: timestamp("resolved_at"),
    closedAt: timestamp("closed_at"),
    customerConfirmed: boolean("customer_confirmed").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("supportTicket_ticketNumber_uq").on(table.ticketNumber),
    index("supportTicket_customerId_idx").on(table.customerId),
    index("supportTicket_subscriptionId_idx").on(table.subscriptionId),
    index("supportTicket_planId_idx").on(table.planId),
    index("supportTicket_categoryId_idx").on(table.categoryId),
    index("supportTicket_status_idx").on(table.status),
    index("supportTicket_priority_idx").on(table.priority),
    index("supportTicket_assignedTo_idx").on(table.assignedTo),
    index("supportTicket_createdAt_idx").on(table.createdAt),
  ],
);

export const supportTicketActivity = pgTable(
  "support_ticket_activity",
  {
    id: text("id").primaryKey(),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => supportTicket.id, { onDelete: "cascade" }),
    activityType: supportTicketActivityTypeEnum("activity_type").notNull(),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    note: text("note"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("supportTicketActivity_ticketId_idx").on(table.ticketId),
    index("supportTicketActivity_activityType_idx").on(table.activityType),
    index("supportTicketActivity_createdBy_idx").on(table.createdBy),
    index("supportTicketActivity_createdAt_idx").on(table.createdAt),
  ],
);

export const supportTicketAttachment = pgTable(
  "support_ticket_attachment",
  {
    id: text("id").primaryKey(),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => supportTicket.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    fileUrl: text("file_url").notNull(),
    fileType: text("file_type"),
    fileSize: text("file_size"),
    uploadedBy: text("uploaded_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("supportTicketAttachment_ticketId_idx").on(table.ticketId),
    index("supportTicketAttachment_uploadedBy_idx").on(table.uploadedBy),
    index("supportTicketAttachment_createdAt_idx").on(table.createdAt),
  ],
);

export const supportTicketAssignment = pgTable(
  "support_ticket_assignment",
  {
    id: text("id").primaryKey(),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => supportTicket.id, { onDelete: "cascade" }),
    assignedTo: text("assigned_to")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    assignedBy: text("assigned_by").references(() => user.id, { onDelete: "set null" }),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    unassignedAt: timestamp("unassigned_at"),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    index("supportTicketAssignment_ticketId_idx").on(table.ticketId),
    index("supportTicketAssignment_assignedTo_idx").on(table.assignedTo),
    index("supportTicketAssignment_assignedBy_idx").on(table.assignedBy),
    index("supportTicketAssignment_isActive_idx").on(table.isActive),
    index("supportTicketAssignment_assignedAt_idx").on(table.assignedAt),
  ],
);

export const supportTicketStatusHistory = pgTable(
  "support_ticket_status_history",
  {
    id: text("id").primaryKey(),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => supportTicket.id, { onDelete: "cascade" }),
    oldStatus: supportTicketStatusEnum("old_status"),
    newStatus: supportTicketStatusEnum("new_status").notNull(),
    changedBy: text("changed_by").references(() => user.id, { onDelete: "set null" }),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("supportTicketStatusHistory_ticketId_idx").on(table.ticketId),
    index("supportTicketStatusHistory_newStatus_idx").on(table.newStatus),
    index("supportTicketStatusHistory_changedBy_idx").on(table.changedBy),
    index("supportTicketStatusHistory_createdAt_idx").on(table.createdAt),
  ],
);

export const supportTicketCategoryRelations = relations(supportTicketCategory, ({ many }) => ({
  tickets: many(supportTicket),
}));

export const supportTicketRelations = relations(supportTicket, ({ many, one }) => ({
  customer: one(customer, {
    fields: [supportTicket.customerId],
    references: [customer.id],
  }),
  subscription: one(customerSubscription, {
    fields: [supportTicket.subscriptionId],
    references: [customerSubscription.id],
  }),
  plan: one(plan, {
    fields: [supportTicket.planId],
    references: [plan.id],
  }),
  category: one(supportTicketCategory, {
    fields: [supportTicket.categoryId],
    references: [supportTicketCategory.id],
  }),
  assignee: one(user, {
    fields: [supportTicket.assignedTo],
    references: [user.id],
  }),
  activities: many(supportTicketActivity),
  attachments: many(supportTicketAttachment),
  assignments: many(supportTicketAssignment),
  statusHistories: many(supportTicketStatusHistory),
}));

export const supportTicketActivityRelations = relations(supportTicketActivity, ({ one }) => ({
  ticket: one(supportTicket, {
    fields: [supportTicketActivity.ticketId],
    references: [supportTicket.id],
  }),
  creator: one(user, {
    fields: [supportTicketActivity.createdBy],
    references: [user.id],
  }),
}));

export const supportTicketAttachmentRelations = relations(supportTicketAttachment, ({ one }) => ({
  ticket: one(supportTicket, {
    fields: [supportTicketAttachment.ticketId],
    references: [supportTicket.id],
  }),
  uploader: one(user, {
    fields: [supportTicketAttachment.uploadedBy],
    references: [user.id],
  }),
}));

export const supportTicketAssignmentRelations = relations(supportTicketAssignment, ({ one }) => ({
  ticket: one(supportTicket, {
    fields: [supportTicketAssignment.ticketId],
    references: [supportTicket.id],
  }),
  assignee: one(user, {
    fields: [supportTicketAssignment.assignedTo],
    references: [user.id],
  }),
  assigner: one(user, {
    fields: [supportTicketAssignment.assignedBy],
    references: [user.id],
  }),
}));

export const supportTicketStatusHistoryRelations = relations(supportTicketStatusHistory, ({ one }) => ({
  ticket: one(supportTicket, {
    fields: [supportTicketStatusHistory.ticketId],
    references: [supportTicket.id],
  }),
  changer: one(user, {
    fields: [supportTicketStatusHistory.changedBy],
    references: [user.id],
  }),
}));

export type SupportTicketCategory = typeof supportTicketCategory.$inferSelect;
export type NewSupportTicketCategory = typeof supportTicketCategory.$inferInsert;
export type SupportTicket = typeof supportTicket.$inferSelect;
export type NewSupportTicket = typeof supportTicket.$inferInsert;
export type SupportTicketActivity = typeof supportTicketActivity.$inferSelect;
export type NewSupportTicketActivity = typeof supportTicketActivity.$inferInsert;
export type SupportTicketAttachment = typeof supportTicketAttachment.$inferSelect;
export type NewSupportTicketAttachment = typeof supportTicketAttachment.$inferInsert;
export type SupportTicketAssignment = typeof supportTicketAssignment.$inferSelect;
export type NewSupportTicketAssignment = typeof supportTicketAssignment.$inferInsert;
export type SupportTicketStatusHistory = typeof supportTicketStatusHistory.$inferSelect;
export type NewSupportTicketStatusHistory = typeof supportTicketStatusHistory.$inferInsert;
