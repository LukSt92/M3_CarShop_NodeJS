"use strict";
// DB INTERACTION
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCars = getCars;
exports.saveUsers = saveUsers;
exports.getUsers = getUsers;
exports.registerUser = registerUser;
exports.loginUser = loginUser;
const path_1 = require("path");
const fs_1 = __importDefault(require("fs"));
const utlis_1 = require("./utlis");
const auth_1 = require("./auth");
const USERS_DB = (0, path_1.join)(__dirname, "..", "db", "users.json");
const CARS_DB = (0, path_1.join)(__dirname, "..", "db", "cars.json");
function getCars() {
    if (!fs_1.default.existsSync(CARS_DB))
        return [];
    const carsData = JSON.parse(fs_1.default.readFileSync(CARS_DB, "utf-8"));
    return carsData;
}
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
    const body = await (0, utlis_1.getData)(req);
    const { username, password } = await JSON.parse(body);
    const users = getUsers();
    if (users.find((u) => u.username === username)) {
        res
            .writeHead(400, { "content-type": "application/json" })
            .end(JSON.stringify({ error: "Błędna nazwa użytkownika, podaj inną." }));
        return;
    }
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
    return;
}
async function loginUser(res, req) {
    const body = await (0, utlis_1.getData)(req);
    const { username, password } = await JSON.parse(body);
    const users = getUsers();
    const user = users.find((u) => username === u.username && password === u.password);
    if (!user)
        res
            .writeHead(401, { "content-type": "application/json" })
            .end(JSON.stringify({ error: "Błędne dane do logowania." }));
    else {
        const token = (0, auth_1.generateToken)(user.id);
        (0, auth_1.setAuthCookie)(res, token);
        res
            .writeHead(200, { "content-type": "application/json" })
            .end(JSON.stringify({}));
    }
}
