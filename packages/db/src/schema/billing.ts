import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { customer } from "./customer";
import { plan } from "./plan";
import { customerSubscription } from "./subscription";
import { tax } from "./tax";

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "issued",
  "partial",
  "paid",
  "overdue",
  "cancelled",
  "void",
]);

export const invoiceItemTypeEnum = pgEnum("invoice_item_type", [
  "subscription",
  "installation",
  "addon",
  "late_fee",
  "discount",
  "adjustment",
]);

export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "failed", "cancelled", "refunded"]);

export const paymentMethodTypeEnum = pgEnum("payment_method_type", [
  "cash",
  "bank_transfer",
  "virtual_account",
  "qris",
  "gateway",
  "other",
]);

export const billingReminderChannelEnum = pgEnum("billing_reminder_channel", ["whatsapp", "email", "sms", "phone", "other"]);

export const billingReminderStatusEnum = pgEnum("billing_reminder_status", ["pending", "sent", "failed"]);

export const billingCycle = pgTable(
  "billing_cycle",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    dayOfMonth: integer("day_of_month").notNull(),
    graceDays: integer("grace_days").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("billingCycle_code_uq").on(table.code),
    uniqueIndex("billingCycle_name_uq").on(table.name),
    index("billingCycle_dayOfMonth_idx").on(table.dayOfMonth),
    index("billingCycle_isActive_idx").on(table.isActive),
  ],
);

export const paymentMethod = pgTable(
  "payment_method",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    type: paymentMethodTypeEnum("type").notNull().default("bank_transfer"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("paymentMethod_code_uq").on(table.code),
    uniqueIndex("paymentMethod_name_uq").on(table.name),
    index("paymentMethod_type_idx").on(table.type),
    index("paymentMethod_isActive_idx").on(table.isActive),
  ],
);

export const invoice = pgTable(
  "invoice",
  {
    id: text("id").primaryKey(),
    invoiceNumber: text("invoice_number").notNull(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customer.id),
    subscriptionId: text("subscription_id").references(() => customerSubscription.id, { onDelete: "set null" }),
    planId: text("plan_id").references(() => plan.id, { onDelete: "set null" }),
    billingCycleId: text("billing_cycle_id").references(() => billingCycle.id, { onDelete: "set null" }),
    billingPeriodStart: date("billing_period_start").notNull(),
    billingPeriodEnd: date("billing_period_end").notNull(),
    issueDate: date("issue_date").notNull(),
    dueDate: date("due_date").notNull(),
    subtotal: integer("subtotal").notNull().default(0),
    taxAmount: integer("tax_amount").notNull().default(0),
    discountAmount: integer("discount_amount").notNull().default(0),
    totalAmount: integer("total_amount").notNull().default(0),
    paidAmount: integer("paid_amount").notNull().default(0),
    balanceAmount: integer("balance_amount").notNull().default(0),
    status: invoiceStatusEnum("status").notNull().default("draft"),
    notes: text("notes"),
    issuedAt: timestamp("issued_at"),
    paidAt: timestamp("paid_at"),
    cancelledAt: timestamp("cancelled_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("invoice_invoiceNumber_uq").on(table.invoiceNumber),
    index("invoice_customerId_idx").on(table.customerId),
    index("invoice_subscriptionId_idx").on(table.subscriptionId),
    index("invoice_planId_idx").on(table.planId),
    index("invoice_billingCycleId_idx").on(table.billingCycleId),
    index("invoice_status_idx").on(table.status),
    index("invoice_dueDate_idx").on(table.dueDate),
    index("invoice_issueDate_idx").on(table.issueDate),
    index("invoice_createdAt_idx").on(table.createdAt),
  ],
);

export const invoiceItem = pgTable(
  "invoice_item",
  {
    id: text("id").primaryKey(),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoice.id, { onDelete: "cascade" }),
    itemType: invoiceItemTypeEnum("item_type").notNull().default("subscription"),
    description: text("description").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: integer("unit_price").notNull().default(0),
    taxId: text("tax_id").references(() => tax.id, { onDelete: "set null" }),
    taxRate: numeric("tax_rate", { precision: 5, scale: 2 }),
    taxAmount: integer("tax_amount").notNull().default(0),
    lineTotal: integer("line_total").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("invoiceItem_invoiceId_idx").on(table.invoiceId),
    index("invoiceItem_itemType_idx").on(table.itemType),
    index("invoiceItem_taxId_idx").on(table.taxId),
    index("invoiceItem_sortOrder_idx").on(table.sortOrder),
  ],
);

export const payment = pgTable(
  "payment",
  {
    id: text("id").primaryKey(),
    paymentNumber: text("payment_number").notNull(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customer.id),
    paymentMethodId: text("payment_method_id").references(() => paymentMethod.id, { onDelete: "set null" }),
    paymentDate: timestamp("payment_date").notNull().defaultNow(),
    amount: integer("amount").notNull().default(0),
    status: paymentStatusEnum("status").notNull().default("pending"),
    referenceNumber: text("reference_number"),
    notes: text("notes"),
    proofUrl: text("proof_url"),
    receivedBy: text("received_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("payment_paymentNumber_uq").on(table.paymentNumber),
    index("payment_customerId_idx").on(table.customerId),
    index("payment_paymentMethodId_idx").on(table.paymentMethodId),
    index("payment_status_idx").on(table.status),
    index("payment_paymentDate_idx").on(table.paymentDate),
    index("payment_createdAt_idx").on(table.createdAt),
  ],
);

export const paymentAllocation = pgTable(
  "payment_allocation",
  {
    id: text("id").primaryKey(),
    paymentId: text("payment_id")
      .notNull()
      .references(() => payment.id, { onDelete: "cascade" }),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoice.id, { onDelete: "cascade" }),
    allocatedAmount: integer("allocated_amount").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("paymentAllocation_paymentId_invoiceId_uq").on(table.paymentId, table.invoiceId),
    index("paymentAllocation_paymentId_idx").on(table.paymentId),
    index("paymentAllocation_invoiceId_idx").on(table.invoiceId),
    index("paymentAllocation_createdAt_idx").on(table.createdAt),
  ],
);

export const invoiceStatusHistory = pgTable(
  "invoice_status_history",
  {
    id: text("id").primaryKey(),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoice.id, { onDelete: "cascade" }),
    oldStatus: invoiceStatusEnum("old_status"),
    newStatus: invoiceStatusEnum("new_status").notNull(),
    changedBy: text("changed_by").references(() => user.id, { onDelete: "set null" }),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("invoiceStatusHistory_invoiceId_idx").on(table.invoiceId),
    index("invoiceStatusHistory_newStatus_idx").on(table.newStatus),
    index("invoiceStatusHistory_changedBy_idx").on(table.changedBy),
    index("invoiceStatusHistory_createdAt_idx").on(table.createdAt),
  ],
);

export const billingReminderLog = pgTable(
  "billing_reminder_log",
  {
    id: text("id").primaryKey(),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoice.id, { onDelete: "cascade" }),
    channel: billingReminderChannelEnum("channel").notNull(),
    status: billingReminderStatusEnum("status").notNull().default("pending"),
    templateCode: text("template_code"),
    recipient: text("recipient"),
    note: text("note"),
    sentAt: timestamp("sent_at"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("billingReminderLog_invoiceId_idx").on(table.invoiceId),
    index("billingReminderLog_channel_idx").on(table.channel),
    index("billingReminderLog_status_idx").on(table.status),
    index("billingReminderLog_createdBy_idx").on(table.createdBy),
    index("billingReminderLog_createdAt_idx").on(table.createdAt),
  ],
);

export const billingCycleRelations = relations(billingCycle, ({ many }) => ({
  invoices: many(invoice),
}));

export const paymentMethodRelations = relations(paymentMethod, ({ many }) => ({
  payments: many(payment),
}));

export const invoiceRelations = relations(invoice, ({ one, many }) => ({
  customer: one(customer, {
    fields: [invoice.customerId],
    references: [customer.id],
  }),
  subscription: one(customerSubscription, {
    fields: [invoice.subscriptionId],
    references: [customerSubscription.id],
  }),
  plan: one(plan, {
    fields: [invoice.planId],
    references: [plan.id],
  }),
  billingCycle: one(billingCycle, {
    fields: [invoice.billingCycleId],
    references: [billingCycle.id],
  }),
  items: many(invoiceItem),
  allocations: many(paymentAllocation),
  statusHistories: many(invoiceStatusHistory),
  reminders: many(billingReminderLog),
}));

export const invoiceItemRelations = relations(invoiceItem, ({ one }) => ({
  invoice: one(invoice, {
    fields: [invoiceItem.invoiceId],
    references: [invoice.id],
  }),
  tax: one(tax, {
    fields: [invoiceItem.taxId],
    references: [tax.id],
  }),
}));

export const paymentRelations = relations(payment, ({ one, many }) => ({
  customer: one(customer, {
    fields: [payment.customerId],
    references: [customer.id],
  }),
  paymentMethod: one(paymentMethod, {
    fields: [payment.paymentMethodId],
    references: [paymentMethod.id],
  }),
  receiver: one(user, {
    fields: [payment.receivedBy],
    references: [user.id],
  }),
  allocations: many(paymentAllocation),
}));

export const paymentAllocationRelations = relations(paymentAllocation, ({ one }) => ({
  payment: one(payment, {
    fields: [paymentAllocation.paymentId],
    references: [payment.id],
  }),
  invoice: one(invoice, {
    fields: [paymentAllocation.invoiceId],
    references: [invoice.id],
  }),
}));

export const invoiceStatusHistoryRelations = relations(invoiceStatusHistory, ({ one }) => ({
  invoice: one(invoice, {
    fields: [invoiceStatusHistory.invoiceId],
    references: [invoice.id],
  }),
  changer: one(user, {
    fields: [invoiceStatusHistory.changedBy],
    references: [user.id],
  }),
}));

export const billingReminderLogRelations = relations(billingReminderLog, ({ one }) => ({
  invoice: one(invoice, {
    fields: [billingReminderLog.invoiceId],
    references: [invoice.id],
  }),
  creator: one(user, {
    fields: [billingReminderLog.createdBy],
    references: [user.id],
  }),
}));

export type BillingCycle = typeof billingCycle.$inferSelect;
export type NewBillingCycle = typeof billingCycle.$inferInsert;
export type PaymentMethod = typeof paymentMethod.$inferSelect;
export type NewPaymentMethod = typeof paymentMethod.$inferInsert;
export type Invoice = typeof invoice.$inferSelect;
export type NewInvoice = typeof invoice.$inferInsert;
export type InvoiceItem = typeof invoiceItem.$inferSelect;
export type NewInvoiceItem = typeof invoiceItem.$inferInsert;
export type Payment = typeof payment.$inferSelect;
export type NewPayment = typeof payment.$inferInsert;
export type PaymentAllocation = typeof paymentAllocation.$inferSelect;
export type NewPaymentAllocation = typeof paymentAllocation.$inferInsert;
export type InvoiceStatusHistory = typeof invoiceStatusHistory.$inferSelect;
export type NewInvoiceStatusHistory = typeof invoiceStatusHistory.$inferInsert;
export type BillingReminderLog = typeof billingReminderLog.$inferSelect;
export type NewBillingReminderLog = typeof billingReminderLog.$inferInsert;
