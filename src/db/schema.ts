import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// Companies table
export const companies = sqliteTable("companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name"),
  url: text("url"),
  address: text("address"),
  city: text("city"),
  zip: text("zip"),
  country: text("country"),
  phone: text("phone"),
  budgetingMonth: text("budgeting_month"),
  comment: text("comment"),
});

// Projects table
export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name"),
  frGoal: real("fr_goal"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

// People (Contacts) table
export const people = sqliteTable("people", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  companyId: integer("company_id").references(() => companies.id, {
    onDelete: "cascade",
  }),
  function: text("function"),
  createdAt: text("created_at"),
});

// Collaborations table
export const collaborations = sqliteTable("collaborations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id").references(() => companies.id, {
    onDelete: "cascade",
  }),
  projectId: integer("project_id").references(() => projects.id, {
    onDelete: "cascade",
  }),
  personId: integer("person_id").references(() => people.id, {
    onDelete: "cascade",
  }),
  responsible: text("responsible"),
  comment: text("comment"),
  contacted: integer("contacted"),
  successful: integer("successful"),
  letter: integer("letter"),
  meeting: integer("meeting"),
  priority: text("priority"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
  amount: real("amount"),
  contactInFuture: integer("contact_in_future"),
  type: text("type"),
});

// Relations
export const companiesRelations = relations(companies, ({ many }) => ({
  people: many(people),
  collaborations: many(collaborations),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  collaborations: many(collaborations),
}));

export const peopleRelations = relations(people, ({ one, many }) => ({
  company: one(companies, {
    fields: [people.companyId],
    references: [companies.id],
  }),
  collaborations: many(collaborations),
}));

export const collaborationsRelations = relations(collaborations, ({ one }) => ({
  company: one(companies, {
    fields: [collaborations.companyId],
    references: [companies.id],
  }),
  project: one(projects, {
    fields: [collaborations.projectId],
    references: [projects.id],
  }),
  person: one(people, {
    fields: [collaborations.personId],
    references: [people.id],
  }),
}));

// Better Auth tables
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }),
});

// Export types
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Person = typeof people.$inferSelect;
export type NewPerson = typeof people.$inferInsert;

export type Collaboration = typeof collaborations.$inferSelect;
export type NewCollaboration = typeof collaborations.$inferInsert;
