import { pgTable, uuid, varchar, text, timestamp, integer, boolean, vector } from 'drizzle-orm/pg-core';

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
  // Vector embedding support
  embedding: vector('embedding', { dimensions: 1536 }),
  embeddingModel: varchar('embedding_model', { length: 50 }).default('text-embedding-3-small'),
  embeddingGeneratedAt: timestamp('embedding_generated_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const offers = pgTable('offers', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  skills: text('skills').array(),
  price: integer('price'), // in cents
  currency: varchar('currency', { length: 3 }).default('USD'),
  locationFlexibility: varchar('location_flexibility', { length: 20 }).default('flexible'),
  status: varchar('status', { length: 20 }).default('active'),
  // Vector embedding support
  embedding: vector('embedding', { dimensions: 1536 }),
  embeddingModel: varchar('embedding_model', { length: 50 }).default('text-embedding-3-small'),
  embeddingGeneratedAt: timestamp('embedding_generated_at'),
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
  estimatedHours: integer('estimated_hours'),
  requiredSkills: text('required_skills').array(),
  deliverable: text('deliverable'),
  dependencies: text('dependencies').array(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Ailock Evolution System Tables
export const ailocks = pgTable('ailocks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).unique().notNull(),
  name: varchar('name', { length: 255 }).default('Ailock'),
  level: integer('level').default(1),
  xp: integer('xp').default(0),
  skillPoints: integer('skill_points').default(0),
  // Characteristics
  insight: integer('insight').default(10),
  efficiency: integer('efficiency').default(10),
  creativity: integer('creativity').default(10),
  collaboration: integer('collaboration').default(10),
  // Personality & Avatar
  avatar: varchar('avatar', { length: 50 }).default('robot'), // robot, analyst, strategist, master, singularity
  personality: varchar('personality', { length: 100 }).default('helpful'),
  // Progress tracking
  totalIntentsCreated: integer('total_intents_created').default(0),
  totalChatMessages: integer('total_chat_messages').default(0),
  totalSkillsUsed: integer('total_skills_used').default(0),
  lastActiveAt: timestamp('last_active_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const ailockSkills = pgTable('ailock_skills', {
  id: uuid('id').defaultRandom().primaryKey(),
  ailockId: uuid('ailock_id').references(() => ailocks.id).notNull(),
  skillId: varchar('skill_id', { length: 100 }).notNull(), // deep_research, predictive_matching, visual_idea_board, etc.
  skillName: varchar('skill_name', { length: 255 }).notNull(),
  skillLevel: integer('skill_level').default(1),
  skillBranch: varchar('skill_branch', { length: 50 }).notNull(), // research, collaboration, convenience
  isUnlocked: boolean('is_unlocked').default(false),
  timesUsed: integer('times_used').default(0),
  lastUsedAt: timestamp('last_used_at'),
  unlockedAt: timestamp('unlocked_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const ailockXpHistory = pgTable('ailock_xp_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  ailockId: uuid('ailock_id').references(() => ailocks.id).notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull(), // intent_created, chat_message, skill_used, achievement_unlocked
  xpGained: integer('xp_gained').notNull(),
  context: text('context'), // JSON context about the event
  description: text('description'), // Human-readable description
  createdAt: timestamp('created_at').defaultNow()
});

export const ailockAchievements = pgTable('ailock_achievements', {
  id: uuid('id').defaultRandom().primaryKey(),
  ailockId: uuid('ailock_id').references(() => ailocks.id).notNull(),
  achievementId: varchar('achievement_id', { length: 100 }).notNull(), // first_intent, chat_master, skill_collector
  achievementName: varchar('achievement_name', { length: 255 }).notNull(),
  description: text('description'),
  iconUrl: varchar('icon_url', { length: 500 }),
  rarity: varchar('rarity', { length: 20 }).default('common'), // common, rare, epic, legendary
  unlockedAt: timestamp('unlocked_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow()
});