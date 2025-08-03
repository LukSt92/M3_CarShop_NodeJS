"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCars = getCars;
exports.saveCars = saveCars;
exports.saveUsers = saveUsers;
exports.getUsers = getUsers;
const path_1 = require("path");
const fs_1 = __importDefault(require("fs"));
const USERS_DB = (0, path_1.join)(__dirname, "..", "db", "users.json");
const CARS_DB = (0, path_1.join)(__dirname, "..", "db", "cars.json");
function getCars() {
    if (!fs_1.default.existsSync(CARS_DB))
        return [];
    const carsData = JSON.parse(fs_1.default.readFileSync(CARS_DB, "utf-8"));
    return carsData;
}
function saveCars(cars) {
    fs_1.default.writeFileSync(CARS_DB, JSON.stringify(cars, null, 2), "utf-8");
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
