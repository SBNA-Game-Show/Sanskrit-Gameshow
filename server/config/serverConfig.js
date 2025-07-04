import express, { json } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";

export const setupServer = () => {
  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(json());

  return { app, server, io };
};

