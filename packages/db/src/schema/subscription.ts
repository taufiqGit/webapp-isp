import { relations } from "drizzle-orm";
import { index, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { customer } from "./customer";

export const customerSubscriptionStatusEnum = pgEnum("customer_subscription_status", [
  "active",
  "suspended",
  "terminated",
]);

export const customerSubscription = pgTable(
  "customer_subscription",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customer.id, { onDelete: "cascade" }),
    packageId: text("package_id").notNull(),
    packageName: text("package_name").notNull(),
    status: customerSubscriptionStatusEnum("status").notNull().default("active"),
    startDate: timestamp("start_date").defaultNow().notNull(),
    endDate: timestamp("end_date"),
    priceMonthly: integer("price_monthly"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("customerSubscription_customerId_idx").on(table.customerId),
    index("customerSubscription_customerId_status_idx").on(table.customerId, table.status),
  ],
);

export const customerSubscriptionRelations = relations(customerSubscription, ({ one }) => ({
  customer: one(customer, {
    fields: [customerSubscription.customerId],
    references: [customer.id],
  }),
}));

export type CustomerSubscription = typeof customerSubscription.$inferSelect;
export type NewCustomerSubscription = typeof customerSubscription.$inferInsert;
