'server-only';

import { genSaltSync, hashSync } from 'bcrypt-ts';
import { desc, eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { user, chat, User, agent, Agent, tool, Tool } from './schema';

// Optionally, if not using username/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle
let client = postgres(`${process.env.POSTGRES_URL!}?sslmode=require`);
let db = drizzle(client);

export async function getUser(username: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.username, username));
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function createUser(username: string, password: string) {
  let salt = genSaltSync(10);
  let hash = hashSync(password, salt);

  try {
    return await db.insert(user).values({ username, password: hash });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

export async function saveChat({
  id,
  messages,
  userId,
}: {
  id: string;
  messages: any;
  userId: string;
}) {
  try {
    const selectedChats = await db.select().from(chat).where(eq(chat.id, id));

    if (selectedChats.length > 0) {
      return await db
        .update(chat)
        .set({
          messages: JSON.stringify(messages),
        })
        .where(eq(chat.id, id));
    }

    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      messages: JSON.stringify(messages),
      userId,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function getAgent(id: string): Promise<Array<Agent>> {
  try {
    return await db.select().from(agent).where(eq(agent.userId, id));
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function createAgent({
  name,
  description,
  avatar,
  intro,
  suggestedActions,
  tool,
  userId,
  prompt,
}: Agent) {
  try {
    return await db.insert(agent).values({
      name,
      description,
      suggestedActions,
      tool,
      prompt,
      avatar,
      intro,
      userId,
    });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

export async function getTool(id: string): Promise<Array<Tool>> {
  try {
    return await db.select().from(tool).where(eq(tool.id, id));
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}
export async function getTools(ids: any[]): Promise<Array<Tool>> {
  try {
    return await db.select().from(tool).where(inArray(tool.id, ids));
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function createApiTool({
  name,
  description,
  typeName,
  accessToken,
  spec,
  userId,
}: Tool) {
  try {
    return await db.insert(tool).values({
      typeName,
      name,
      description,
      accessToken,
      spec,
      userId,
    });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}
export async function createContractTool({
  name,
  description,
  typeName,
  params,
  typeFunction,
  functions,
  userId,
}: Tool) {
  try {
    return await db.insert(tool).values({
      name,
      description,
      typeName,
      params,
      typeFunction,
      functions,
      userId,
    });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}
export async function createWidgetTool({
  name,
  description,
  typeName,
  prompt,
  code,
  toolWidget,
  userId,
}: Tool) {
  try {
    return await db.insert(tool).values({
      name,
      description,
      typeName,
      prompt,
      code,
      toolWidget,
      userId,
    });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}
