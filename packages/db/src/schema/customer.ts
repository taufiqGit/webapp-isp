import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const customerTypeEnum = pgEnum("customer_type", ["individual", "business"]);

export const customerStatusEnum = pgEnum("customer_status", [
  "prospect",
  "active",
  "suspended",
  "terminated",
]);

export const customerIdentityTypeEnum = pgEnum("customer_identity_type", [
  "ktp",
  "sim",
  "passport",
  "npwp",
  "other",
]);

export const customer = pgTable(
  "customer",
  {
    id: text("id").primaryKey(),
    customerNumber: text("customer_number").notNull(),
    type: customerTypeEnum("type").notNull().default("individual"),
    status: customerStatusEnum("status").notNull().default("prospect"),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    identityType: customerIdentityTypeEnum("identity_type"),
    identityNumber: text("identity_number"),
    birthDate: date("birth_date"),
    taxId: text("tax_id"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("customer_customerNumber_uq").on(table.customerNumber),
    uniqueIndex("customer_email_uq").on(table.email),
    index("customer_phone_idx").on(table.phone),
    index("customer_status_idx").on(table.status),
    index("customer_type_idx").on(table.type),
  ],
);

export const customerAddressTypeEnum = pgEnum("customer_address_type", [
  "billing",
  "service",
  "installation",
  "other",
]);

export const customerAddress = pgTable(
  "customer_address",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customer.id, { onDelete: "cascade" }),
    type: customerAddressTypeEnum("type").notNull().default("service"),
    label: text("label"),
    line1: text("line1").notNull(),
    line2: text("line2"),
    village: text("village"),
    district: text("district"),
    city: text("city").notNull(),
    province: text("province").notNull(),
    postalCode: text("postal_code"),
    country: text("country").notNull().default("ID"),
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("customerAddress_customerId_idx").on(table.customerId),
    index("customerAddress_type_idx").on(table.type),
    uniqueIndex("customerAddress_customerId_type_isPrimary_uq").on(
      table.customerId,
      table.type,
      table.isPrimary,
    ),
  ],
);

export const customerRelations = relations(customer, ({ many }) => ({
  addresses: many(customerAddress),
}));

export const customerAddressRelations = relations(customerAddress, ({ one }) => ({
  customer: one(customer, {
    fields: [customerAddress.customerId],
    references: [customer.id],
  }),
}));

export type Customer = typeof customer.$inferSelect;
export type NewCustomer = typeof customer.$inferInsert;
export type CustomerAddress = typeof customerAddress.$inferSelect;
export type NewCustomerAddress = typeof customerAddress.$inferInsert;
