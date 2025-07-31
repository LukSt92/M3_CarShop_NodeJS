import { IncomingMessage } from "http";

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
