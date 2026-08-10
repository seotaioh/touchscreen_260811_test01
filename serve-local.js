const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const host = "127.0.0.1";
const port = Number(process.env.PORT || 8000);
const root = __dirname;

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg"
};

http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, `http://${host}`).pathname);
  const requested = pathname === "/" ? "prototype.html" : pathname.replace(/^\/+/, "");
  const file = path.resolve(root, requested);

  if (file !== root && !file.startsWith(root + path.sep)) {
    res.writeHead(403).end("Forbidden");
    return;
  }

  fs.readFile(file, (error, body) => {
    if (error) {
      res.writeHead(error.code === "ENOENT" ? 404 : 500).end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(body);
  });
}).listen(port, host, () => {
  console.log(`Local prototype: http://${host}:${port}/`);
});
