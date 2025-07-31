import { createServer, IncomingMessage, ServerResponse } from "http";
import fs from "fs";
import url from "url";
import path from "path";
import { Mimes } from "./types";
import { getUsers, loginUser, registerUser } from "./db";

const PORT = 3000;
const frontendPath = path.join(__dirname, "..", "frontend");
const MIME_TYPES: Mimes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
};

const sendFile = (res: ServerResponse, filePath: string): void => {
  fs.readFile(filePath, (err, data) => {
    if (err) return res.writeHead(404).end("Not found.");
    const ext = path.extname(filePath);
    console.log(ext);
    res.writeHead(200, { "content-type": MIME_TYPES[ext] || "text/plain" });
    res.end(data);
  });
};

const server = createServer(
  async (req: IncomingMessage, res: ServerResponse) => {
    const pathname = req.url;
    const method = req.method;

    if (method === "GET" && pathname === "/")
      return sendFile(res, `${frontendPath}/index.html`);
    if (method === "GET" && pathname?.startsWith("/style.css"))
      return sendFile(res, `${frontendPath}/style.css`);
    if (method === "GET" && pathname?.startsWith("/main.js"))
      return sendFile(res, `${frontendPath}/main.js`);

    if (method === "POST" && pathname === "/register")
      return registerUser(res, req);

    // TODO dodać ciasteczko i za jego pomocą sprawdzić czy użytkownik jest zalogowany oraz czy jest adminem.
    // if (method === "GET" && pathname === "/users") {
    //   res
    //     .writeHead(200, { "Content-Type": "application/json" })
    //     .end(JSON.stringify(getUsers()));
    // }
    if (method === "POST" && pathname === "/login") return loginUser(res, req);

    res.end(JSON.stringify({ status: "ok" }));
    // 1. Obsługa endpointów
    // 2. Proste serwowanie plików statycznych z katalogu frontend (np. pod ścieżką /static/)
  }
);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
