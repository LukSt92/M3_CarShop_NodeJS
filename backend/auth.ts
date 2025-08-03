import jwt from "jsonwebtoken";
import { ServerResponse, IncomingMessage } from "http";
import { getUsers } from "./db";
import { User } from "./types";
import { SECRET } from "./variables";

export function generateToken(userId: string): string {
  const token = jwt.sign({ id: userId }, SECRET);
  return token;
}

export function getUserFromToken(token: string): User | null {
  try {
    const userToken = jwt.verify(token, SECRET);
    const users = getUsers();

    if (typeof userToken === "object") {
      const user = users.find((u) => userToken.id === u.id);
      return user || null;
    }
  } catch (e) {
    console.error("Token jest nieaktualny");
  }
  return null;
}

export function setAuthCookie(res: ServerResponse, token: string) {
  res.setHeader("Set-Cookie", [`token=${token}; Path=/; HttpOnly`]);
}

export function parseCookies(req: IncomingMessage): Record<string, string> {
  const cookiesHeader = req.headers.cookie || "";
  const cookies: Record<string, string> = {};
  cookiesHeader.split(";").map((c) => {
    const [k, v] = c.split("=");
    cookies[k] = v;
  });
  return cookies;
}
