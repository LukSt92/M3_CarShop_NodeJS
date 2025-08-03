import { createServer, IncomingMessage, ServerResponse } from "http";
import path from "path";
import { sendFile } from "./utilis";
import {
  registerUser,
  loginUser,
  addCar,
  updateCar,
  authUser,
  updateUser,
  showCars,
  sseHandler,
  deleteUser,
} from "./routes";

const PORT = 3000;
const frontendPath = path.join(__dirname, "..", "frontend");

const server = createServer(
  async (req: IncomingMessage, res: ServerResponse) => {
    const pathname = req.url;
    const method = req.method;
    const userPathname = pathname?.match(/^\/users\/([^\/]+)$/);

    if (method === "GET" && pathname === "/")
      return sendFile(res, `${frontendPath}/index.html`);
    if (method === "GET" && pathname?.startsWith("/style.css"))
      return sendFile(res, `${frontendPath}/style.css`);
    if (method === "GET" && pathname?.startsWith("/main.js"))
      return sendFile(res, `${frontendPath}/main.js`);

    if (pathname === "/sse") return sseHandler(res, req);

    if (method === "POST" && pathname === "/register")
      return registerUser(res, req);

    if (method === "GET" && pathname === "/users") return authUser(res, req);

    if (method === "PUT" && userPathname)
      return updateUser(res, req, userPathname);

    if (method === "DELETE" && userPathname)
      return deleteUser(res, req, userPathname);

    if (method === "POST" && pathname === "/login") return loginUser(res, req);

    if (method === "GET" && pathname === "/cars") {
      return showCars(res, req);
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
