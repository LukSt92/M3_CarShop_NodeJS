"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const path_1 = __importDefault(require("path"));
const utilis_1 = require("./utilis");
const routes_1 = require("./routes");
const PORT = 3000;
const frontendPath = path_1.default.join(__dirname, "..", "frontend");
const server = (0, http_1.createServer)(async (req, res) => {
    const pathname = req.url;
    const method = req.method;
    const userPathname = pathname === null || pathname === void 0 ? void 0 : pathname.match(/^\/users\/([^\/]+)$/);
    if (method === "GET" && pathname === "/")
        return (0, utilis_1.sendFile)(res, `${frontendPath}/index.html`);
    if (method === "GET" && (pathname === null || pathname === void 0 ? void 0 : pathname.startsWith("/style.css")))
        return (0, utilis_1.sendFile)(res, `${frontendPath}/style.css`);
    if (method === "GET" && (pathname === null || pathname === void 0 ? void 0 : pathname.startsWith("/main.js")))
        return (0, utilis_1.sendFile)(res, `${frontendPath}/main.js`);
    if (pathname === "/sse")
        return (0, routes_1.sseHandler)(res, req);
    if (method === "POST" && pathname === "/register")
        return (0, routes_1.registerUser)(res, req);
    if (method === "GET" && pathname === "/users")
        return (0, routes_1.authUser)(res, req);
    if (method === "PUT" && userPathname)
        return (0, routes_1.updateUser)(res, req, userPathname);
    if (method === "DELETE" && userPathname)
        return (0, routes_1.deleteUser)(res, req, userPathname);
    if (method === "POST" && pathname === "/login")
        return (0, routes_1.loginUser)(res, req);
    if (method === "GET" && pathname === "/cars") {
        return (0, routes_1.showCars)(res, req);
    }
    if (method === "POST" && pathname === "/cars") {
        return (0, routes_1.addCar)(res, req);
    }
    if (method === "POST" && (pathname === null || pathname === void 0 ? void 0 : pathname.endsWith("/buy")))
        return (0, routes_1.updateCar)(res, req, pathname);
    res.end(JSON.stringify({ status: "ok" }));
    // 1. Obsługa endpointów
    // 2. Proste serwowanie plików statycznych z katalogu frontend (np. pod ścieżką /static/)
});
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
