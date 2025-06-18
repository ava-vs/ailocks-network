import type { Handler } from '@netlify/functions';
import { db } from '../../src/lib/db';
import { sql } from 'drizzle-orm';

export const handler: Handler = async () => {
  try {
    console.log('🔄 Creating database tables via Netlify Function...');
    
    // Instead of using migration files (which aren't available in Netlify Functions runtime),
    // we'll execute the SQL directly to create all necessary tables
    
    const createTablesSQL = `
      -- Create users table
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "email" varchar(255) NOT NULL,
        "name" varchar(255),
        "country" varchar(2),
        "city" varchar(255),
        "timezone" varchar(50),
        "languages" text[],
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "users_email_unique" UNIQUE("email")
      );

      -- Create intents table
      CREATE TABLE IF NOT EXISTS "intents" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid,
        "title" varchar(500) NOT NULL,
        "description" text NOT NULL,
        "category" varchar(100) NOT NULL,
        "target_country" varchar(2),
        "target_city" varchar(255),
        "required_skills" text[],
        "budget" integer,
        "timeline" varchar(255),
        "priority" varchar(20) DEFAULT 'normal',
        "status" varchar(20) DEFAULT 'active',
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );

      -- Create chat_sessions table
      CREATE TABLE IF NOT EXISTS "chat_sessions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid,
        "blob_key" varchar(255),
        "mode" varchar(50),
        "language" varchar(10),
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "chat_sessions_blob_key_unique" UNIQUE("blob_key")
      );

      -- Create smart_chains table
      CREATE TABLE IF NOT EXISTS "smart_chains" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "root_intent_id" uuid,
        "title" varchar(500) NOT NULL,
        "description" text,
        "status" varchar(20) DEFAULT 'planning',
        "total_steps" integer DEFAULT 0,
        "completed_steps" integer DEFAULT 0,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );

      -- Create chain_steps table
      CREATE TABLE IF NOT EXISTS "chain_steps" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "chain_id" uuid,
        "step_number" integer NOT NULL,
        "title" varchar(500) NOT NULL,
        "description" text,
        "status" varchar(20) DEFAULT 'pending',
        "assigned_user_id" uuid,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `;

    // Execute table creation
    await db.execute(sql.raw(createTablesSQL));
    console.log('✅ Tables created successfully');

    // Now add foreign key constraints (separately to avoid dependency issues)
    const addConstraintsSQL = `
      -- Add foreign key constraints
      DO $$ 
      BEGIN
        -- Add intents -> users foreign key if not exists
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'intents_user_id_users_id_fk'
        ) THEN
          ALTER TABLE "intents" ADD CONSTRAINT "intents_user_id_users_id_fk" 
          FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
        END IF;

        -- Add chat_sessions -> users foreign key if not exists
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'chat_sessions_user_id_users_id_fk'
        ) THEN
          ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_users_id_fk" 
          FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
        END IF;

        -- Add smart_chains -> intents foreign key if not exists
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'smart_chains_root_intent_id_intents_id_fk'
        ) THEN
          ALTER TABLE "smart_chains" ADD CONSTRAINT "smart_chains_root_intent_id_intents_id_fk" 
          FOREIGN KEY ("root_intent_id") REFERENCES "public"."intents"("id") ON DELETE no action ON UPDATE no action;
        END IF;

        -- Add chain_steps -> smart_chains foreign key if not exists
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'chain_steps_chain_id_smart_chains_id_fk'
        ) THEN
          ALTER TABLE "chain_steps" ADD CONSTRAINT "chain_steps_chain_id_smart_chains_id_fk" 
          FOREIGN KEY ("chain_id") REFERENCES "public"."smart_chains"("id") ON DELETE no action ON UPDATE no action;
        END IF;

        -- Add chain_steps -> users foreign key if not exists
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'chain_steps_assigned_user_id_users_id_fk'
        ) THEN
          ALTER TABLE "chain_steps" ADD CONSTRAINT "chain_steps_assigned_user_id_users_id_fk" 
          FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
        END IF;
      END $$;
    `;

    await db.execute(sql.raw(addConstraintsSQL));
    console.log('✅ Foreign key constraints added successfully');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status: 'success', 
        message: 'Database tables created successfully',
        timestamp: new Date().toISOString(),
        tables: ['users', 'intents', 'chat_sessions', 'smart_chains', 'chain_steps']
      })
    };
  } catch (error) {
    console.error('Database setup error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status: 'error', 
        message: (error as Error).message,
        timestamp: new Date().toISOString()
      })
    };
  }
}; 