"use strict";
// DB INTERACTION
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = getUsers;
exports.registerUser = registerUser;
const path_1 = require("path");
const fs_1 = __importDefault(require("fs"));
const USERS_DB = (0, path_1.join)(__dirname, "..", "db", "users.json");
function saveUsers(users) {
    fs_1.default.writeFileSync(USERS_DB, JSON.stringify(users, null, 2), "utf-8");
}
function getUsers() {
    if (!fs_1.default.existsSync(USERS_DB))
        return [];
    const usersData = JSON.parse(fs_1.default.readFileSync(USERS_DB, "utf-8"));
    return usersData;
}
async function registerUser(res, req) {
    let body = "";
    req.on("data", (chunk) => {
        body += chunk;
    });
    req.on("end", async () => {
        const { username, password } = await JSON.parse(body);
        const users = getUsers();
        if (users.find((u) => u.username === username))
            res
                .writeHead(400, { "content-type": "application/json" })
                .end(JSON.stringify({ error: "Błędna nazwa użytkownika, podaj inną." }));
        const newUser = {
            id: `${username}${Date.now()}`,
            username,
            password,
            role: "user",
            balance: 50000,
        };
        users.push(newUser);
        saveUsers(users);
        res
            .writeHead(201, { "content-type": "application/json" })
            .end(JSON.stringify({}));
    });
}
