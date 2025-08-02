"use strict";
// DB INTERACTION
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCars = getCars;
exports.saveCars = saveCars;
exports.saveUsers = saveUsers;
exports.getUsers = getUsers;
exports.getSingleCar = getSingleCar;
exports.updateCar = updateCar;
exports.addCar = addCar;
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
function getSingleCar(carId) {
    const cars = getCars();
    const carMatch = cars.find((c) => c.id === carId);
    return carMatch ? carMatch : null;
}
async function updateCar(res, req, pathname) {
    const { token } = (0, auth_1.parseCookies)(req);
    const userFromToken = (0, auth_1.getUserFromToken)(token);
    const cars = getCars();
    const users = getUsers();
    const user = users.find((u) => u.id === (userFromToken === null || userFromToken === void 0 ? void 0 : userFromToken.id));
    const carId = pathname.split("/")[2];
    const car = cars.find((c) => c.id === carId);
    if (user && car) {
        if (user.id === car.ownerId) {
            res.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({
                error: "Nie możesz kupić już posiadanego samochodu.",
            }));
        }
        else if (user.balance < car.price) {
            res.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({
                error: "Masz niewystarczającą ilość środków by zakupić ten samochód.",
            }));
        }
        else {
            user.balance -= car.price;
            saveUsers(users);
            car.ownerId = user.id;
            saveCars(cars);
            res
                .writeHead(200, { "content-type": "application/json" })
                .end(JSON.stringify({}));
        }
    }
}
async function addCar(res, req) {
    const { token } = (0, auth_1.parseCookies)(req);
    const user = (0, auth_1.getUserFromToken)(token);
    if ((user === null || user === void 0 ? void 0 : user.role) !== "admin") {
        res
            .writeHead(400, { "content-type": "application/json" })
            .end(JSON.stringify({ error: "Tylko admin może dodawać samochody." }));
    }
    else {
        const cars = getCars();
        const body = await (0, utlis_1.getData)(req);
        const { model, price } = await JSON.parse(body);
        const newCar = {
            id: `${model}${Date.now()}`,
            model,
            price,
            ownerId: "",
        };
        cars.push(newCar);
        saveCars(cars);
        res
            .writeHead(201, { "content-type": "application/json" })
            .end(JSON.stringify({}));
    }
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
