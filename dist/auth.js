"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.getUserFromToken = getUserFromToken;
exports.setAuthCookie = setAuthCookie;
exports.parseCookies = parseCookies;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("./db");
const variables_1 = require("./variables");
function generateToken(userId) {
    const token = jsonwebtoken_1.default.sign({ id: userId }, variables_1.SECRET);
    return token;
}
function getUserFromToken(token) {
    try {
        const userToken = jsonwebtoken_1.default.verify(token, variables_1.SECRET);
        const users = (0, db_1.getUsers)();
        if (typeof userToken === "object") {
            const user = users.find((u) => userToken.id === u.id);
            return user || null;
        }
    }
    catch (e) {
        console.error("Token jest nieaktualny");
    }
    return null;
}
function setAuthCookie(res, token) {
    res.setHeader("Set-Cookie", [`token=${token}; Path=/; HttpOnly`]);
}
function parseCookies(req) {
    const cookiesHeader = req.headers.cookie || "";
    const cookies = {};
    cookiesHeader.split(";").map((c) => {
        const [k, v] = c.split("=");
        cookies[k] = v;
    });
    return cookies;
}
