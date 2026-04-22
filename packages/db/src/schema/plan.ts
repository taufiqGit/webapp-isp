import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { tax } from "./tax";

export const plan = pgTable(
  "plan",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    speedMbps: integer("speed_mbps").notNull(),
    priceMonthly: integer("price_monthly").notNull(),
    taxId: text("tax_id").references(() => tax.id, { onDelete: "set null" }),
    isActive: boolean("is_active").notNull().default(true),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("plan_code_uq").on(table.code),
    uniqueIndex("plan_name_uq").on(table.name),
    index("plan_speedMbps_idx").on(table.speedMbps),
    index("plan_priceMonthly_idx").on(table.priceMonthly),
    index("plan_isActive_idx").on(table.isActive),
    index("plan_taxId_idx").on(table.taxId),
  ],
);

export type Plan = typeof plan.$inferSelect;
export type NewPlan = typeof plan.$inferInsert;
