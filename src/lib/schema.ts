import { pgTable, uuid, varchar, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  country: varchar('country', { length: 2 }),
  city: varchar('city', { length: 255 }),
  timezone: varchar('timezone', { length: 50 }),
  languages: text('languages').array(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  blobKey: varchar('blob_key', { length: 255 }).unique(),
  mode: varchar('mode', { length: 50 }),
  language: varchar('language', { length: 10 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const intents = pgTable('intents', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  targetCountry: varchar('target_country', { length: 2 }),
  targetCity: varchar('target_city', { length: 255 }),
  requiredSkills: text('required_skills').array(),
  budget: integer('budget'),
  timeline: varchar('timeline', { length: 255 }),
  priority: varchar('priority', { length: 20 }).default('normal'),
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const smartChains = pgTable('smart_chains', {
  id: uuid('id').defaultRandom().primaryKey(),
  rootIntentId: uuid('root_intent_id').references(() => intents.id),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).default('planning'),
  totalSteps: integer('total_steps').default(0),
  completedSteps: integer('completed_steps').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const chainSteps = pgTable('chain_steps', {
  id: uuid('id').defaultRandom().primaryKey(),
  chainId: uuid('chain_id').references(() => smartChains.id),
  stepNumber: integer('step_number').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).default('pending'),
  assignedUserId: uuid('assigned_user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});