"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sseHandler = sseHandler;
exports.authUser = authUser;
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
exports.showCars = showCars;
exports.addCar = addCar;
exports.updateCar = updateCar;
exports.editCar = editCar;
exports.deleteCar = deleteCar;
const utilis_1 = require("./utilis");
const auth_1 = require("./auth");
const db_1 = require("./db");
const activeUsers = [];
async function sseHandler(res, req) {
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
    });
    res.write("Connected to server\n\n");
    activeUsers.push(res);
    req.on("close", () => {
        activeUsers.splice(activeUsers.indexOf(res), 1);
    });
    return;
}
async function authUser(res, req) {
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
async function registerUser(res, req) {
    const body = await (0, utilis_1.getData)(req);
    const { username, password } = await JSON.parse(body);
    const users = (0, db_1.getUsers)();
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
    (0, db_1.saveUsers)(users);
    res
        .writeHead(201, { "content-type": "application/json" })
        .end(JSON.stringify({}));
    return;
}
async function loginUser(res, req) {
    const body = await (0, utilis_1.getData)(req);
    const { username, password } = await JSON.parse(body);
    const users = (0, db_1.getUsers)();
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
async function updateUser(res, req, pathname) {
    const userIdToUpdate = pathname[1];
    const users = (0, db_1.getUsers)();
    const userToUpdate = users.find((u) => u.id === userIdToUpdate);
    const body = await (0, utilis_1.getData)(req);
    const { username, password } = await JSON.parse(body);
    const cookies = (0, auth_1.parseCookies)(req);
    const currentUser = (0, auth_1.getUserFromToken)(cookies.token);
    if ((currentUser === null || currentUser === void 0 ? void 0 : currentUser.id) !== (userToUpdate === null || userToUpdate === void 0 ? void 0 : userToUpdate.id)) {
        res
            .writeHead(400, { "content-type": "application/json" })
            .end(JSON.stringify({ error: "Nie ma hackowania." }));
        return;
    }
    else if (!userToUpdate) {
        res
            .writeHead(400, { "content-type": "application/json" })
            .end(JSON.stringify({ error: "Użytkownik nie istnieje." }));
        return;
    }
    if (username === "more" && password === "money") {
        userToUpdate.balance += 100000;
        (0, db_1.saveUsers)(users);
        res
            .writeHead(200, { "content-type": "application/json" })
            .end(JSON.stringify({ message: "Kod aktywowany" }));
        return;
    }
    else {
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
}
async function deleteUser(res, req, pathname) {
    const userIdToDelete = pathname[1];
    const users = (0, db_1.getUsers)();
    const userToDelete = users.find((u) => u.id === userIdToDelete);
    const cookies = (0, auth_1.parseCookies)(req);
    const currentUser = (0, auth_1.getUserFromToken)(cookies.token);
    if ((currentUser === null || currentUser === void 0 ? void 0 : currentUser.id) !== (userToDelete === null || userToDelete === void 0 ? void 0 : userToDelete.id) || (currentUser === null || currentUser === void 0 ? void 0 : currentUser.role) === "admin") {
        res
            .writeHead(400, { "content-type": "application/json" })
            .end(JSON.stringify({ error: "Nie ma hackowania." }));
        return;
    }
    else {
        const newUsers = users.filter((u) => u.id !== (userToDelete === null || userToDelete === void 0 ? void 0 : userToDelete.id));
        (0, db_1.saveUsers)(newUsers);
        res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({
            message: `Usunięto użytkownika o id: ${userIdToDelete}`,
        }));
        return;
    }
}
async function showCars(res, req) {
    const carsData = (0, db_1.getCars)();
    if (!carsData) {
        res
            .writeHead(400, { "content-type": "application/json" })
            .end({ error: "Błąd przy pobieraniu danych samochodów." });
        return;
    }
    else {
        res
            .writeHead(200, { "content-type": "application/json" })
            .end(JSON.stringify(carsData));
        return;
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
        const cars = (0, db_1.getCars)();
        const body = await (0, utilis_1.getData)(req);
        const { model, price } = await JSON.parse(body);
        const newCar = {
            id: `${model}${Date.now()}`,
            model,
            price,
            ownerId: "",
        };
        cars.push(newCar);
        (0, db_1.saveCars)(cars);
        res
            .writeHead(201, { "content-type": "application/json" })
            .end(JSON.stringify({}));
    }
}
async function updateCar(res, req, pathname) {
    const { token } = (0, auth_1.parseCookies)(req);
    const userFromToken = (0, auth_1.getUserFromToken)(token);
    const cars = (0, db_1.getCars)();
    const users = (0, db_1.getUsers)();
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
            const sseData = {
                event: "purchase",
                carId: car.id,
                buyerId: user.id,
            };
            user.balance -= car.price;
            (0, db_1.saveUsers)(users);
            car.ownerId = user.id;
            (0, db_1.saveCars)(cars);
            activeUsers.forEach((u) => {
                u.write(`data: ${JSON.stringify(sseData)}\n\n`);
            });
            res
                .writeHead(200, { "content-type": "application/json" })
                .end(JSON.stringify({}));
            return;
        }
    }
    else if (!car) {
        res.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({
            error: "Nie znaleziono takiego samochodu. Wprowadź poprawne ID samochodu.",
        }));
    }
    else {
        res.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({
            error: "Błąd autoryzacji użytkownika.",
        }));
    }
}
async function editCar(res, req, pathname) {
    const carIdToUpdate = pathname[1];
    const cars = (0, db_1.getCars)();
    const carToUpdate = cars.find((c) => c.id === carIdToUpdate);
    const body = await (0, utilis_1.getData)(req);
    const { model, price, ownerId } = await JSON.parse(body);
    const cookies = (0, auth_1.parseCookies)(req);
    const currentUser = (0, auth_1.getUserFromToken)(cookies.token);
    if ((currentUser === null || currentUser === void 0 ? void 0 : currentUser.role) !== "admin") {
        res
            .writeHead(400, { "content-type": "application/json" })
            .end(JSON.stringify({ error: "Tylko admin może zmieniać dane samochodów." }));
        return;
    }
    else if (!carToUpdate) {
        res
            .writeHead(400, { "content-type": "application/json" })
            .end(JSON.stringify({ error: "Dany samochód nie istnieje." }));
        return;
    }
    else {
        if (model && model !== carToUpdate.model)
            carToUpdate.model = model;
        if (price && price !== carToUpdate.price)
            carToUpdate.price = price;
        if (ownerId && ownerId !== carToUpdate.ownerId)
            carToUpdate.ownerId = ownerId;
        (0, db_1.saveCars)(cars);
        res
            .writeHead(200, { "content-type": "application/json" })
            .end(JSON.stringify({ message: "dane samochodu zostały zaktualizowane." }));
        return;
    }
}
async function deleteCar(res, req, pathname) {
    const carIdToDelete = pathname[1];
    const cars = (0, db_1.getCars)();
    const carToDelete = cars.find((c) => c.id === carIdToDelete);
    const cookies = (0, auth_1.parseCookies)(req);
    const currentUser = (0, auth_1.getUserFromToken)(cookies.token);
    if ((currentUser === null || currentUser === void 0 ? void 0 : currentUser.role) === "admin") {
        res
            .writeHead(400, { "content-type": "application/json" })
            .end(JSON.stringify({ error: "Tylko admin może usuwać samochody." }));
        return;
    }
    else {
        const newCars = cars.filter((c) => c.id !== (carToDelete === null || carToDelete === void 0 ? void 0 : carToDelete.id));
        (0, db_1.saveCars)(newCars);
        res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({
            message: `Usunięto samochód o id: ${carIdToDelete}`,
        }));
        return;
    }
}
