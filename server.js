const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 8787);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "pastes.json");
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".jpg": "image/jpeg", ".png": "image/png", ".json": "application/json; charset=utf-8" };

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf8");

function readPastes() { try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); } catch { return []; } }
function writePastes(items) { fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), "utf8"); }
function send(res, status, body, type = "application/json; charset=utf-8") { res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" }); res.end(type.startsWith("application/json") ? JSON.stringify(body) : body); }
function publicPaste(paste) { return { id: paste.id, title: paste.title, text: paste.text, syntax: paste.syntax, createdAt: paste.createdAt, views: paste.views }; }
function readBody(req) { return new Promise((resolve, reject) => { let raw = ""; req.on("data", (chunk) => { raw += chunk; if (raw.length > 1200000) req.destroy(); }); req.on("end", () => { try { resolve(JSON.parse(raw || "{}")); } catch { reject(new Error("invalid json")); } }); req.on("error", reject); }); }
function newId(items) { let id; do { id = crypto.randomBytes(5).toString("base64url"); } while (items.some((item) => item.id === id)); return id; }

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (req.method === "POST" && url.pathname === "/api/pastes") {
    try {
      const body = await readBody(req);
      const text = typeof body.text === "string" ? body.text.trim() : "";
      if (!text || text.length > 100000) return send(res, 400, { error: "Text must be between 1 and 100000 characters" });
      const items = readPastes();
      const paste = { id: newId(items), title: String(body.title || "").trim().slice(0, 90) || "نص بدون عنوان", text, syntax: String(body.syntax || "text"), createdAt: new Date().toISOString(), views: 0 };
      items.push(paste); writePastes(items); return send(res, 201, publicPaste(paste));
    } catch { return send(res, 400, { error: "Invalid request" }); }
  }
  const match = url.pathname.match(/^\/api\/pastes\/([a-zA-Z0-9_-]+)$/);
  if (req.method === "GET" && match) {
    const items = readPastes(); const paste = items.find((item) => item.id === match[1]);
    if (!paste) return send(res, 404, { error: "Not found" });
    paste.views += 1; writePastes(items); return send(res, 200, publicPaste(paste));
  }
  if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, { error: "Method not allowed" });
  let filePath = url.pathname === "/" || url.pathname.startsWith("/p/") ? path.join(ROOT, "index.html") : path.normalize(path.join(ROOT, url.pathname));
  if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) filePath = path.join(ROOT, "index.html");
  const type = MIME[path.extname(filePath)] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-cache" });
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, "0.0.0.0", () => console.log(`freepluszero running at http://127.0.0.1:${PORT}`));
