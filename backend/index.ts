import { createServer, IncomingMessage, ServerResponse } from "http";
import fs from "fs";
import url from "url";
import path from "path";
import { Mimes } from "./types";
import {
  addCar,
  getCars,
  getUsers,
  loginUser,
  registerUser,
  saveUsers,
  updateCar,
} from "./db";
import { getUserFromToken, parseCookies } from "./auth";
import { getData } from "./utlis";

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
    if (method === "GET" && pathname === "/users") {
      const cookies = parseCookies(req);

      if (!cookies) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({}));
        return;
      }
      const token = cookies.token;

      if (!token) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({}));
        return;
      }

      const user = getUserFromToken(token);

      if (!user) {
        res
          .writeHead(400, { "content-type": "application/json" })
          .end(JSON.stringify({ error: "Użytkownik nie jest zalogowany" }));
        return;
      } else {
        if (user.role === "user") {
          res
            .writeHead(200, { "content-type": "application/json" })
            .end(JSON.stringify(user));
          return;
        } else {
          res
            .writeHead(200, { "content-type": "application/json" })
            .end(JSON.stringify(getUsers()));
          return;
        }
      }
    }

    const putUserPathname = pathname?.match(/^\/users\/([^\/]+)$/);

    if (method === "PUT" && putUserPathname) {
      const userIdToUpdate = putUserPathname[1];
      const users = getUsers();
      const userToUpdate = users.find((u) => u.id === userIdToUpdate);
      const body = await getData(req);
      const { username, password } = await JSON.parse(body);

      if (!userToUpdate) {
        res
          .writeHead(400, { "content-type": "application/json" })
          .end(JSON.stringify({ error: "Użytkownik nie istnieje." }));
        return;
      }
      if (username && username !== userToUpdate.username)
        userToUpdate.username = username;
      if (password && password !== userToUpdate.password)
        userToUpdate.password = password;

      saveUsers(users);
      res
        .writeHead(200, { "content-type": "application/json" })
        .end(JSON.stringify({}));
      return;
    }

    if (method === "POST" && pathname === "/login") return loginUser(res, req);

    if (method === "GET" && pathname === "/cars") {
      const carsData = getCars();
      if (!carsData) {
        res
          .writeHead(400, { "content-type": "application/json" })
          .end({ error: "Błąd przy pobieraniu danych samochodów." });
        return;
      }
      res
        .writeHead(200, { "content-type": "application/json" })
        .end(JSON.stringify(carsData));
      return;
    }

    if (method === "POST" && pathname === "/cars") {
      return addCar(res, req);
    }

    if (method === "POST" && pathname?.endsWith("/buy"))
      return updateCar(res, req, pathname);

    res.end(JSON.stringify({ status: "ok" }));
    // 1. Obsługa endpointów
    // 2. Proste serwowanie plików statycznych z katalogu frontend (np. pod ścieżką /static/)
  }
);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
