"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_1 = require("./db");
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
        console.log(ext);
        res.writeHead(200, { "content-type": MIME_TYPES[ext] || "text/plain" });
        res.end(data);
    });
};
const server = (0, http_1.createServer)(async (req, res) => {
    const pathname = req.url;
    const method = req.method;
    if (method === "GET" && pathname === "/")
        return sendFile(res, `${frontendPath}/index.html`);
    if (method === "GET" && (pathname === null || pathname === void 0 ? void 0 : pathname.startsWith("/style.css")))
        return sendFile(res, `${frontendPath}/style.css`);
    if (method === "GET" && (pathname === null || pathname === void 0 ? void 0 : pathname.startsWith("/main.js")))
        return sendFile(res, `${frontendPath}/main.js`);
    if (method === "POST" && pathname === "/register")
        return (0, db_1.registerUser)(res, req);
    res.end(JSON.stringify({ status: "ok" }));
    console.log(__dirname);
    // 1. Obsługa endpointów
    // 2. Proste serwowanie plików statycznych z katalogu frontend (np. pod ścieżką /static/)
});
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
