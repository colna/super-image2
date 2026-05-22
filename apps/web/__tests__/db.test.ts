import type { Session, Message } from "@super-image/utils";
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";

import {
  db,
  addSession,
  getSession,
  getAllSessions,
  updateSession,
  deleteSession,
  addMessage,
  getMessage,
  getMessagesBySession,
  updateMessage,
  deleteMessage,
  saveImage,
  getImage,
  getImagesByMessage,
} from "../lib/db";

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: crypto.randomUUID(),
    title: "Test Session",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    providerId: "openai",
    modelId: "gpt-image-2",
    ...overrides,
  };
}

function makeMessage(
  sessionId: string,
  overrides: Partial<Message> = {},
): Message {
  return {
    id: crypto.randomUUID(),
    sessionId,
    role: "user",
    type: "generate",
    content: "A cat on the moon",
    images: [],
    createdAt: Date.now(),
    status: "done",
    ...overrides,
  };
}

beforeEach(async () => {
  await db.sessions.clear();
  await db.messages.clear();
  await db.imageStore.clear();
});

// ---- Session CRUD ----

describe("Session helpers", () => {
  it("addSession + getSession", async () => {
    const s = makeSession();
    await addSession(s);
    const found = await getSession(s.id);
    expect(found).toEqual(s);
  });

  it("getAllSessions returns ordered by updatedAt desc", async () => {
    const s1 = makeSession({ updatedAt: 100 });
    const s2 = makeSession({ updatedAt: 300 });
    const s3 = makeSession({ updatedAt: 200 });
    await addSession(s1);
    await addSession(s2);
    await addSession(s3);
    const all = await getAllSessions();
    expect(all.map((s) => s.id)).toEqual([s2.id, s3.id, s1.id]);
  });

  it("updateSession modifies fields", async () => {
    const s = makeSession();
    await addSession(s);
    await updateSession(s.id, { title: "Updated" });
    const found = await getSession(s.id);
    expect(found?.title).toBe("Updated");
  });

  it("deleteSession cascades to messages and images", async () => {
    const s = makeSession();
    await addSession(s);
    const m = makeMessage(s.id);
    await addMessage(m);
    const blob = new Blob(["png"], { type: "image/png" });
    await saveImage("img-1", blob, m.id);

    await deleteSession(s.id);

    expect(await getSession(s.id)).toBeUndefined();
    expect(await getMessage(m.id)).toBeUndefined();
    expect(await getImage("img-1")).toBeUndefined();
  });
});

// ---- Message CRUD ----

describe("Message helpers", () => {
  it("addMessage + getMessage", async () => {
    const s = makeSession();
    await addSession(s);
    const m = makeMessage(s.id);
    await addMessage(m);
    const found = await getMessage(m.id);
    expect(found).toEqual(m);
  });

  it("getMessagesBySession returns ordered by createdAt", async () => {
    const s = makeSession();
    await addSession(s);
    const m1 = makeMessage(s.id, { createdAt: 100 });
    const m2 = makeMessage(s.id, { createdAt: 300 });
    const m3 = makeMessage(s.id, { createdAt: 200 });
    await addMessage(m1);
    await addMessage(m2);
    await addMessage(m3);
    const msgs = await getMessagesBySession(s.id);
    expect(msgs.map((m) => m.id)).toEqual([m1.id, m3.id, m2.id]);
  });

  it("updateMessage modifies fields", async () => {
    const s = makeSession();
    await addSession(s);
    const m = makeMessage(s.id);
    await addMessage(m);
    await updateMessage(m.id, { status: "error" });
    const found = await getMessage(m.id);
    expect(found?.status).toBe("error");
  });

  it("deleteMessage cascades to images", async () => {
    const s = makeSession();
    await addSession(s);
    const m = makeMessage(s.id);
    await addMessage(m);
    const blob = new Blob(["png"], { type: "image/png" });
    await saveImage("img-2", blob, m.id);

    await deleteMessage(m.id);

    expect(await getMessage(m.id)).toBeUndefined();
    expect(await getImage("img-2")).toBeUndefined();
  });
});

// ---- Image helpers ----

describe("Image helpers", () => {
  it("saveImage + getImage", async () => {
    const blob = new Blob(["raw-png-data"], { type: "image/png" });
    await saveImage("img-3", blob, "msg-1");
    const found = await getImage("img-3");
    expect(found).toBeDefined();
    expect(found!.messageId).toBe("msg-1");
    expect(found!.blob).toBeDefined();
  });

  it("getImagesByMessage returns all images for a message", async () => {
    const blob1 = new Blob(["a"], { type: "image/png" });
    const blob2 = new Blob(["b"], { type: "image/png" });
    await saveImage("img-4", blob1, "msg-2");
    await saveImage("img-5", blob2, "msg-2");
    await saveImage("img-6", blob1, "msg-other");

    const images = await getImagesByMessage("msg-2");
    expect(images).toHaveLength(2);
    expect(images.map((i) => i.id).sort()).toEqual(["img-4", "img-5"]);
  });
});
