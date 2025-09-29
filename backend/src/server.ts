import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import friendRoutes from "./routes/friends.js";
import serverRoutes from "./routes/servers.js";
import messageRoutes from "./routes/messages.js";
import { setupSocket } from "./socket/socketHandlers.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

mongoose
    .connect(process.env.MONGODB_URI!)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));

setupSocket(io);

app.use("/api/auth", authRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/servers", serverRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
    res.send("relay-cat backend is purring!");
});

httpServer.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});
