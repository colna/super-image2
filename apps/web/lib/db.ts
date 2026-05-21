import type { Message, Session } from "@super-image/utils";
import Dexie, { type Table } from "dexie";

export interface StoredImage {
  id: string;
  blob: Blob;
  messageId: string;
  createdAt: number;
}

class SuperImageDB extends Dexie {
  sessions!: Table<Session>;
  messages!: Table<Message>;
  imageStore!: Table<StoredImage>;

  constructor() {
    super("super-image");
    this.version(1).stores({
      sessions: "id, updatedAt",
      messages: "id, sessionId, createdAt, [sessionId+createdAt]",
      imageStore: "id, messageId, createdAt",
    });
  }
}

export const db = new SuperImageDB();

// ---- Session helpers ----

export async function addSession(session: Session): Promise<string> {
  return db.sessions.add(session);
}

export async function getSession(id: string): Promise<Session | undefined> {
  return db.sessions.get(id);
}

export async function getAllSessions(): Promise<Session[]> {
  return db.sessions.orderBy("updatedAt").reverse().toArray();
}

export async function updateSession(
  id: string,
  changes: Partial<Session>,
): Promise<number> {
  return db.sessions.update(id, changes);
}

export async function deleteSession(id: string): Promise<void> {
  await db.transaction("rw", [db.sessions, db.messages, db.imageStore], async () => {
    const messages = await db.messages.where("sessionId").equals(id).toArray();
    const messageIds = messages.map((m) => m.id);
    await db.imageStore.where("messageId").anyOf(messageIds).delete();
    await db.messages.where("sessionId").equals(id).delete();
    await db.sessions.delete(id);
  });
}

// ---- Message helpers ----

export async function addMessage(message: Message): Promise<string> {
  return db.messages.add(message);
}

export async function getMessage(id: string): Promise<Message | undefined> {
  return db.messages.get(id);
}

export async function getMessagesBySession(sessionId: string): Promise<Message[]> {
  return db.messages.where("[sessionId+createdAt]").between(
    [sessionId, Dexie.minKey],
    [sessionId, Dexie.maxKey],
  ).toArray();
}

export async function updateMessage(
  id: string,
  changes: Partial<Message>,
): Promise<number> {
  return db.messages.update(id, changes);
}

export async function deleteMessage(id: string): Promise<void> {
  await db.transaction("rw", [db.messages, db.imageStore], async () => {
    await db.imageStore.where("messageId").equals(id).delete();
    await db.messages.delete(id);
  });
}

// ---- Image helpers (原始 PNG Blob，不压缩) ----

export async function saveImage(
  id: string,
  blob: Blob,
  messageId: string,
): Promise<string> {
  return db.imageStore.put({ id, blob, messageId, createdAt: Date.now() });
}

export async function getImage(id: string): Promise<StoredImage | undefined> {
  return db.imageStore.get(id);
}

export async function getImagesByMessage(messageId: string): Promise<StoredImage[]> {
  return db.imageStore.where("messageId").equals(messageId).toArray();
}
