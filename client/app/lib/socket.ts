import { io, Socket } from "socket.io-client";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";

export function createSocket(token: string): Socket {
  return io(SERVER_URL, {
    auth: { token },
  });
}