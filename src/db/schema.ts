import {
  sqliteTable,
  integer,
  text,
  real,
  index,
} from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

// Companies table
export const companies = sqliteTable(
  "companies",
  {
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
  },
  (table) => [index("idx_companies_name").on(table.name)]
);

// Projects table
export const projects = sqliteTable(
  "projects",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name"),
    frGoal: real("fr_goal"),
    createdAt: text("created_at"),
    updatedAt: text("updated_at"),
  },
  (table) => [index("idx_projects_created_at").on(table.createdAt)]
);

// People (Contacts) table
export const people = sqliteTable(
  "people",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name"),
    email: text("email"),
    phone: text("phone"),
    companyId: integer("company_id").references(() => companies.id, {
      onDelete: "cascade",
    }),
    function: text("function"),
    createdAt: text("created_at"),
  },
  (table) => [
    index("idx_people_company_id").on(table.companyId),
    index("idx_people_name").on(table.name),
  ]
);

// Collaborations table
export const collaborations = sqliteTable(
  "collaborations",
  {
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
  },
  (table) => [
    // Indexes for WHERE clauses and JOINs
    index("idx_collaborations_company_id").on(table.companyId),
    index("idx_collaborations_project_id").on(table.projectId),
    index("idx_collaborations_person_id").on(table.personId),
    // Indexes for ORDER BY clauses
      index("idx_collaborations_updated_at").on(table.updatedAt),
      index("idx_collaborations_created_at").on(table.createdAt),
    // Composite index for filtered queries
    index("idx_collaborations_company_contact_future").on(
      table.companyId,
      table.contactInFuture
    ),
    index("idx_collaborations_contact_future").on(table.contactInFuture),
    // Partial index for filtered queries
    index("idx_collaborations_responsible_filtered")
      .on(table.responsible)
      .where(
        sql`${table.responsible} IS NOT NULL AND ${table.responsible} != ''`
      ),
  ]
);

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

// App Users table (extends Better Auth user)
export const appUsers = sqliteTable(
  "app_users",
  {
    id: text("id").primaryKey(), // References Better Auth user.id
    fullName: text("full_name").notNull(),
    email: text("email").notNull().unique(),
    role: text("role").notNull(), // Administrator, Project responsible, Project team member, Observer
    description: text("description"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    addedBy: text("added_by"), // User ID who added this user
    lastLogin: text("last_login"),
    isLocked: integer("is_locked", { mode: "boolean" })
      .notNull()
      .default(false),
  },
  (table) => [
    index("idx_app_users_full_name").on(table.fullName),
    index("idx_app_users_last_login").on(table.lastLogin),
  ]
);

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

export type AppUser = typeof appUsers.$inferSelect;
export type NewAppUser = typeof appUsers.$inferInsert;
