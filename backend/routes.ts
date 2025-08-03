import { Car, User } from "./types";
import { IncomingMessage, ServerResponse } from "http";
import { getData } from "./utilis";
import {
  generateToken,
  getUserFromToken,
  parseCookies,
  setAuthCookie,
} from "./auth";
import { getUsers, saveUsers, getCars, saveCars } from "./db";

const activeUsers: ServerResponse[] = [];

export async function sseHandler(res: ServerResponse, req: IncomingMessage) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  res.write("Connected to server\n\n");
  activeUsers.push(res);
  console.log("SSE START");

  req.on("close", () => {
    activeUsers.splice(activeUsers.indexOf(res), 1);
  });
  return;
}

export async function authUser(
  res: ServerResponse,
  req: IncomingMessage
): Promise<void> {
  const cookies = parseCookies(req);

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

  const user = getUserFromToken(token);

  if (!user) {
    res
      .writeHead(400, { "content-type": "application/json" })
      .end(JSON.stringify({ error: "Użytkownik nie jest zalogowany" }));
    return;
  } else {
    if (user.role === "user") {
      res
        .writeHead(200, { "content-type": "application/json" })
        .end(JSON.stringify(user));
      return;
    } else {
      res
        .writeHead(200, { "content-type": "application/json" })
        .end(JSON.stringify(getUsers()));
      return;
    }
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

export async function updateUser(
  res: ServerResponse,
  req: IncomingMessage,
  pathname: RegExpMatchArray
) {
  const userIdToUpdate = pathname[1];
  const users = getUsers();
  const userToUpdate = users.find((u) => u.id === userIdToUpdate);
  const body = await getData(req);
  const { username, password } = await JSON.parse(body);

  if (!userToUpdate) {
    res
      .writeHead(400, { "content-type": "application/json" })
      .end(JSON.stringify({ error: "Użytkownik nie istnieje." }));
    return;
  }
  if (username === "more" && password === "money") {
    userToUpdate.balance += 100000;
    saveUsers(users);
    res
      .writeHead(200, { "content-type": "application/json" })
      .end(JSON.stringify({ message: "Kod aktywowany" }));
    return;
  } else {
    if (username && username !== userToUpdate.username)
      userToUpdate.username = username;
    if (password && password !== userToUpdate.password)
      userToUpdate.password = password;

    saveUsers(users);
    res
      .writeHead(200, { "content-type": "application/json" })
      .end(JSON.stringify({}));
    return;
  }
}

export async function showCars(res: ServerResponse, req: IncomingMessage) {
  const carsData = getCars();
  if (!carsData) {
    res
      .writeHead(400, { "content-type": "application/json" })
      .end({ error: "Błąd przy pobieraniu danych samochodów." });
    return;
  } else {
    res
      .writeHead(200, { "content-type": "application/json" })
      .end(JSON.stringify(carsData));
    return;
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
      const sseData = {
        event: "purchase",
        carId: car.id,
        buyerId: user.id,
      };

      user.balance -= car.price;
      saveUsers(users);
      car.ownerId = user.id;
      saveCars(cars);

      activeUsers.forEach((u) => {
        u.write(`data: ${JSON.stringify(sseData)}\n\n`);
      });

      res
        .writeHead(200, { "content-type": "application/json" })
        .end(JSON.stringify({}));
      return;
    }
  } else if (!car) {
    res.writeHead(400, { "content-type": "application/json" }).end(
      JSON.stringify({
        error:
          "Nie znaleziono takiego samochodu. Wprowadź poprawne ID samochodu.",
      })
    );
  } else {
    res.writeHead(400, { "content-type": "application/json" }).end(
      JSON.stringify({
        error: "Błąd autoryzacji użytkownika.",
      })
    );
  }
}
