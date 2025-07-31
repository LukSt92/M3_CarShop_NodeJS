// DB INTERACTION

import { join } from "path";
import fs from "fs";
import { User } from "./types";
import { IncomingMessage, ServerResponse } from "http";
import { getData } from "./utlis";
import { generateToken, setAuthCookie } from "./auth";

const USERS_DB = join(__dirname, "..", "db", "users.json");

function saveUsers(users: User[]): void {
  fs.writeFileSync(USERS_DB, JSON.stringify(users, null, 2), "utf-8");
}

export function getUsers(): User[] {
  if (!fs.existsSync(USERS_DB)) return [];
  const usersData = JSON.parse(fs.readFileSync(USERS_DB, "utf-8"));
  return usersData;
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
