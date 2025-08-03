import { IncomingMessage, ServerResponse } from "http";
import path from "path";
import fs from "fs";
import { MIME_TYPES } from "./variables";

export async function getData(req: IncomingMessage): Promise<string> {
  return new Promise((resolve: (value: string) => void) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", async () => {
      resolve(data);
    });
  });
}

export const sendFile = (res: ServerResponse, filePath: string): void => {
  fs.readFile(filePath, (err, data) => {
    if (err) return res.writeHead(404).end("Not found.");
    const ext = path.extname(filePath);
    res.writeHead(200, { "content-type": MIME_TYPES[ext] || "text/plain" });
    res.end(data);
  });
};
