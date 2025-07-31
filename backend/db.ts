// DB INTERACTION

import { join } from "path";
import fs from "fs";
import { User } from "./types";
import { IncomingMessage, ServerResponse } from "http";

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
        .end(
          JSON.stringify({ error: "Błędna nazwa użytkownika, podaj inną." })
        );

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
  });
}
