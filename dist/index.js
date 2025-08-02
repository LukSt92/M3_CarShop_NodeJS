"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activeUsers = void 0;
const http_1 = require("http");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_1 = require("./db");
const auth_1 = require("./auth");
const utlis_1 = require("./utlis");
const PORT = 3000;
const frontendPath = path_1.default.join(__dirname, "..", "frontend");
const MIME_TYPES = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
};
const sendFile = (res, filePath) => {
    fs_1.default.readFile(filePath, (err, data) => {
        if (err)
            return res.writeHead(404).end("Not found.");
        const ext = path_1.default.extname(filePath);
        res.writeHead(200, { "content-type": MIME_TYPES[ext] || "text/plain" });
        res.end(data);
    });
};
exports.activeUsers = [];
const server = (0, http_1.createServer)(async (req, res) => {
    const pathname = req.url;
    const method = req.method;
    if (method === "GET" && pathname === "/")
        return sendFile(res, `${frontendPath}/index.html`);
    if (method === "GET" && (pathname === null || pathname === void 0 ? void 0 : pathname.startsWith("/style.css")))
        return sendFile(res, `${frontendPath}/style.css`);
    if (method === "GET" && (pathname === null || pathname === void 0 ? void 0 : pathname.startsWith("/main.js")))
        return sendFile(res, `${frontendPath}/main.js`);
    if (pathname === "/sse") {
        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        });
        res.write("Connected to server\n\n");
        exports.activeUsers.push(res);
        req.on("close", () => {
            exports.activeUsers.splice(exports.activeUsers.indexOf(res), 1);
        });
        return;
    }
    if (method === "POST" && pathname === "/register")
        return (0, db_1.registerUser)(res, req);
    // TODO dodać ciasteczko i za jego pomocą sprawdzić czy użytkownik jest zalogowany oraz czy jest adminem.
    if (method === "GET" && pathname === "/users") {
        const cookies = (0, auth_1.parseCookies)(req);
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
        const user = (0, auth_1.getUserFromToken)(token);
        if (!user) {
            res
                .writeHead(400, { "content-type": "application/json" })
                .end(JSON.stringify({ error: "Użytkownik nie jest zalogowany" }));
            return;
        }
        else {
            if (user.role === "user") {
                res
                    .writeHead(200, { "content-type": "application/json" })
                    .end(JSON.stringify(user));
                return;
            }
            else {
                res
                    .writeHead(200, { "content-type": "application/json" })
                    .end(JSON.stringify((0, db_1.getUsers)()));
                return;
            }
        }
    }
    const putUserPathname = pathname === null || pathname === void 0 ? void 0 : pathname.match(/^\/users\/([^\/]+)$/);
    if (method === "PUT" && putUserPathname) {
        const userIdToUpdate = putUserPathname[1];
        const users = (0, db_1.getUsers)();
        const userToUpdate = users.find((u) => u.id === userIdToUpdate);
        const body = await (0, utlis_1.getData)(req);
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
        (0, db_1.saveUsers)(users);
        res
            .writeHead(200, { "content-type": "application/json" })
            .end(JSON.stringify({}));
        return;
    }
    if (method === "POST" && pathname === "/login")
        return (0, db_1.loginUser)(res, req);
    if (method === "GET" && pathname === "/cars") {
        const carsData = (0, db_1.getCars)();
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
        return (0, db_1.addCar)(res, req);
    }
    if (method === "POST" && (pathname === null || pathname === void 0 ? void 0 : pathname.endsWith("/buy")))
        return (0, db_1.updateCar)(res, req, pathname);
    res.end(JSON.stringify({ status: "ok" }));
    // 1. Obsługa endpointów
    // 2. Proste serwowanie plików statycznych z katalogu frontend (np. pod ścieżką /static/)
});
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
