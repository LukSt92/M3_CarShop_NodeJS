// DB INTERACTION

import { join } from "path";
import fs from "fs";
import { Car, User } from "./types";
import { IncomingMessage, ServerResponse } from "http";
import { getData } from "./utlis";
import {
  generateToken,
  getUserFromToken,
  parseCookies,
  setAuthCookie,
} from "./auth";

const USERS_DB = join(__dirname, "..", "db", "users.json");
const CARS_DB = join(__dirname, "..", "db", "cars.json");

export function getCars(): Car[] {
  if (!fs.existsSync(CARS_DB)) return [];
  const carsData = JSON.parse(fs.readFileSync(CARS_DB, "utf-8"));
  return carsData;
}

export function saveCars(cars: Car[]): void {
  fs.writeFileSync(CARS_DB, JSON.stringify(cars, null, 2), "utf-8");
}

export function saveUsers(users: User[]): void {
  fs.writeFileSync(USERS_DB, JSON.stringify(users, null, 2), "utf-8");
}

export function getUsers(): User[] {
  if (!fs.existsSync(USERS_DB)) return [];
  const usersData = JSON.parse(fs.readFileSync(USERS_DB, "utf-8"));
  return usersData;
}

export function getSingleCar(carId: string): Car | null {
  const cars = getCars();
  const carMatch = cars.find((c) => c.id === carId);
  return carMatch ? carMatch : null;
}

export async function updateCar(
  res: ServerResponse,
  req: IncomingMessage,
  pathname: string
): Promise<void> {
  const { token } = parseCookies(req);
  const userFromToken = getUserFromToken(token);
  const cars = getCars();
  const users = getUsers();
  const user = users.find((u) => u.id === userFromToken?.id);
  const carId = pathname.split("/")[2];
  const car = cars.find((c) => c.id === carId);

  if (user && car) {
    if (user.id === car.ownerId) {
      res.writeHead(400, { "content-type": "application/json" }).end(
        JSON.stringify({
          error: "Nie możesz kupić już posiadanego samochodu.",
        })
      );
    } else if (user.balance < car.price) {
      res.writeHead(400, { "content-type": "application/json" }).end(
        JSON.stringify({
          error: "Masz niewystarczającą ilość środków by zakupić ten samochód.",
        })
      );
    } else {
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

export async function addCar(
  res: ServerResponse,
  req: IncomingMessage
): Promise<void> {
  const { token } = parseCookies(req);
  const user = getUserFromToken(token);

  if (user?.role !== "admin") {
    res
      .writeHead(400, { "content-type": "application/json" })
      .end(JSON.stringify({ error: "Tylko admin może dodawać samochody." }));
  } else {
    const cars = getCars();
    const body = await getData(req);
    const { model, price } = await JSON.parse(body);
    const newCar: Car = {
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

export async function registerUser(
  res: ServerResponse,
  req: IncomingMessage
): Promise<void> {
  const body = await getData(req);
  const { username, password } = await JSON.parse(body);
  const users = getUsers();

  if (users.find((u) => u.username === username)) {
    res
      .writeHead(400, { "content-type": "application/json" })
      .end(JSON.stringify({ error: "Błędna nazwa użytkownika, podaj inną." }));
    return;
  }

  const newUser: User = {
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

export async function loginUser(
  res: ServerResponse,
  req: IncomingMessage
): Promise<void> {
  const body = await getData(req);
  const { username, password } = await JSON.parse(body);
  const users = getUsers();

  const user = users.find(
    (u) => username === u.username && password === u.password
  );

  if (!user)
    res
      .writeHead(401, { "content-type": "application/json" })
      .end(JSON.stringify({ error: "Błędne dane do logowania." }));
  else {
    const token = generateToken(user.id);

    setAuthCookie(res, token);
    res
      .writeHead(200, { "content-type": "application/json" })
      .end(JSON.stringify({}));
  }
}
