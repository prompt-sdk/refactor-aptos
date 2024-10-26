import { Message } from 'ai';
import { sql, InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
} from 'drizzle-orm/pg-core';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  username: varchar('username', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  messages: json('messages').notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
});

export const suggestedActions = pgTable('SuggestedActions', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  title: varchar('title', { length: 64 }).notNull(),
  description: varchar('description', { length: 256 }),
  content: varchar('description', { length: 256 }).notNull(),
  agentId: uuid('agentId')
    .notNull()
    .references(() => agent.id),
});

export const tool = pgTable('Tool', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: text('name').notNull(),
  typeName: varchar('typeName', { length: 64 }).notNull(),
  description: text('description'),
  //Tool Contract
  params: json('params'),
  generic_type_params: text('generic_type_params')
    .array()
    .default(sql`ARRAY[]::text[]`),
  functions: varchar('functions', { length: 256 }),
  typeFunction: varchar('typeFunction', { length: 64 }),
  // Tool API
  accessToken: text('accessToken'),
  spec: json('spec'),
  // Tool Widget
  prompt: text('prompt'),
  code: text('code'),
  toolImportWidget: text('toolImportWidget')
    .array()
    .default(sql`ARRAY[]::text[]`),
  //UserId
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
});

export const agent = pgTable('Agent', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  name: varchar('name', { length: 64 }).notNull(),
  description: varchar('description', { length: 256 }).notNull(),
  avatar: varchar('avatar', { length: 256 }).notNull(),
  tool: text('tool')
    .array()
    .default(sql`ARRAY[]::text[]`),
  intro: varchar('intro', { length: 256 }),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
});

export type Agent = InferSelectModel<typeof agent>;

export type Chat = Omit<InferSelectModel<typeof chat>, 'messages'> & {
  messages: Array<Message>;
};
