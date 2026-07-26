import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import documentRoutes from "./routes/document.routes";
import { registerSocketHandlers } from "./realtime/socket-handlers";
import versionRoutes from "./routes/version.routes";
import collaboratorRoutes from "./routes/collaborator.routes";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/documents", versionRoutes);
app.use("/api/documents", collaboratorRoutes);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
registerSocketHandlers(io);
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});