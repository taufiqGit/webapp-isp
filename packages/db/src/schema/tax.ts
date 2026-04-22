import { index, numeric, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const tax = pgTable(
  "tax",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    rate: numeric("rate", { precision: 5, scale: 2 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("tax_code_uq").on(table.code),
    uniqueIndex("tax_name_uq").on(table.name),
    index("tax_createdAt_idx").on(table.createdAt),
  ],
);

export type Tax = typeof tax.$inferSelect;
export type NewTax = typeof tax.$inferInsert;
