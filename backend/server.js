import express from "express";
import connectDB from "./config/mongoConfig.js";
import cors from "cors";
import "dotenv/config";
import userRouter from "./routes/userRoute.js";
// video-call dependencies...
import { Server } from "socket.io";
import { createServer } from "node:http"; // to connect socket's server and express instace with each other
import { connectToSocket } from "./controllers/socketManager.js";
// app config
const app = express();
const Port = process.env.PORT || 4000;
connectDB();

const server = createServer(app); //Listens for **HTTP requests** on a port(Handles regular REST API calls (`GET /status`, etc.))
const io = connectToSocket(server); //Listens for **WebSocket connections** on the **same port**(Handles real-time bidirectional communication)

// middelwares
app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:5173", "https://zenmeet.onrender.com"], // Your Vite dev server
    credentials: true,
  })
);

app.use(express.urlencoded({ limit: "40kb", extended: true }));

// API endpoints
app.use("/api/users", userRouter);

app.get("/", (req, res) => {
  res.send("server running!");
});

server.listen(Port, () => {
  console.log(`Server running on port ${Port}`);
});
