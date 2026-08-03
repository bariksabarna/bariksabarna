const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "dist");
const PORT = Number(process.env.PORT) || 8099;
const BASE = "/bariksabarna";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".avif": "image/avif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
};

function contentType(file) {
  return TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let p = decodeURIComponent(url.pathname);

  if (p.startsWith(BASE)) p = p.slice(BASE.length) || "/";

  if (p.endsWith("/")) p += "index.html";
  if (path.extname(p) === "") p += ".html";

  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      fs.readFile(path.join(ROOT, "404.html"), (err404, body) => {
        if (err404) {
          res.writeHead(404);
          return res.end("Not Found");
        }
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        res.end(body);
      });
      return;
    }
    res.writeHead(200, { "Content-Type": contentType(file) });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Preview server running at http://localhost:${PORT}${BASE}/`);
  console.log("Press Ctrl+C to stop.");
});
