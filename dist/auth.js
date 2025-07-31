"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.getUserFromToken = getUserFromToken;
exports.setAuthCookie = setAuthCookie;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("./db");
const SECRET = "SECRET";
function generateToken(userId) {
    const token = jsonwebtoken_1.default.sign({ id: userId }, SECRET, { expiresIn: "10m" });
    return token;
}
function getUserFromToken(token) {
    const userToken = jsonwebtoken_1.default.verify(token, SECRET);
    const users = (0, db_1.getUsers)();
    if (typeof userToken === "object") {
        const user = users.find((u) => userToken.id === u.id);
        return user || null;
    }
    return null;
}
function setAuthCookie(res, token) {
    res.setHeader("Set-Cookie", `token=${token}; Path=/; HttpOnly`);
}
// export function parseCookies(req: IncomingMessage): Record<string, string> {
// }
