import jwt from "jsonwebtoken";
import { ServerResponse } from "http";
import { getUsers } from "./db";
import { User } from "./types";

const SECRET = "SECRET";

export function generateToken(userId: string): string {
  const token = jwt.sign({ id: userId }, SECRET, { expiresIn: "10m" });
  return token;
}

export function getUserFromToken(token: string): User | null {
  const userToken = jwt.verify(token, SECRET);
  const users = getUsers();

  if (typeof userToken === "object") {
    const user = users.find((u) => userToken.id === u.id);
    return user || null;
  }
  return null;
}

export function setAuthCookie(res: ServerResponse, token: string) {
  res.setHeader("Set-Cookie", `token=${token}; Path=/; HttpOnly`);
}

// export function parseCookies(req: IncomingMessage): Record<string, string> {
// }
