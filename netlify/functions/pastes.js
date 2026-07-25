import { getStore } from "@netlify/blobs";
import { randomBytes } from "node:crypto";

const store = getStore("freepluszero-pastes");
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const allowedSyntax = new Set(["text", "code", "json", "markdown"]);
const expiryTimes = { day: 86400000, week: 604800000, month: 2592000000 };

function createId() {
  return randomBytes(6).toString("base64url");
}

function publicPaste(paste) {
  return { id: paste.id, title: paste.title, text: paste.text, syntax: paste.syntax, createdAt: paste.createdAt, expiresAt: paste.expiresAt, views: paste.views || 0 };
}

export default async (request) => {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/.netlify\/functions\/pastes/, "");
  const id = path.match(/^\/api\/pastes\/([A-Za-z0-9_-]+)$/)?.[1] || path.match(/^\/([A-Za-z0-9_-]+)$/)?.[1];

  if (request.method === "POST") {
    try {
      const body = await request.json();
      const text = typeof body.text === "string" ? body.text.trim() : "";
      if (!text || text.length > 100000) return json(400, { error: "Text must be between 1 and 100000 characters." });
      const expiry = expiryTimes[body.expiry] ? body.expiry : "never";
      const paste = {
        id: createId(),
        title: String(body.title || "").trim().slice(0, 90) || "نص بدون عنوان",
        text,
        syntax: allowedSyntax.has(body.syntax) ? body.syntax : "text",
        createdAt: new Date().toISOString(),
        expiresAt: expiry === "never" ? null : new Date(Date.now() + expiryTimes[expiry]).toISOString(),
        views: 0
      };
      await store.setJSON(paste.id, paste, { onlyIfNew: true });
      return json(201, publicPaste(paste));
    } catch {
      return json(400, { error: "Invalid request." });
    }
  }

  if (request.method === "GET" && id) {
    const paste = await store.get(id, { type: "json" });
    if (!paste) return json(404, { error: "Not found." });
    if (paste.expiresAt && Date.parse(paste.expiresAt) <= Date.now()) {
      await store.delete(id);
      return json(404, { error: "Expired." });
    }
    paste.views = Number(paste.views || 0) + 1;
    await store.setJSON(id, paste);
    return json(200, publicPaste(paste));
  }

  return json(405, { error: "Method not allowed." });
};
