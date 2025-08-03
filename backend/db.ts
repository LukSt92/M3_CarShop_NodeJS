import { join } from "path";
import fs from "fs";
import { Car, User } from "./types";

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
