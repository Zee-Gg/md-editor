import { io as ioClient } from "socket.io-client";
import * as Y from "yjs";

// Replace with a real token (from login) and a real document ID (from create/list)
const TOKEN = "";
const DOC_ID = "";

function createClient(name: string): Promise<{ socket: any; ydoc: Y.Doc; ytext: Y.Text }> {
  return new Promise((resolve) => {
    const socket = ioClient("http://localhost:4000", {
      auth: { token: TOKEN },
    });

    const ydoc = new Y.Doc();
    const ytext = ydoc.getText("content");

    socket.on("connect", () => {
      console.log(`[${name}] connected`);
      socket.emit("join-document", DOC_ID);
    });

    socket.on("sync-init", (state: Uint8Array) => {
      Y.applyUpdate(ydoc, new Uint8Array(state));
      resolve({ socket, ydoc, ytext });
    });

    socket.on("sync-update", (update: Uint8Array) => {
      Y.applyUpdate(ydoc, new Uint8Array(update));
    });

    socket.on("presence-list", (users: any[]) => {
      console.log(`[${name}] presence list:`, users.map((u) => u.name));
    });

    socket.on("user-joined", (user: any) => {
      console.log(`[${name}] saw user join:`, user.name);
    });

    socket.on("user-left", (data: any) => {
      console.log(`[${name}] saw user leave:`, data.userId);
    });

    socket.on("user-typing", (data: any) => {
      console.log(`[${name}] saw typing indicator from:`, data.userName);
    });

    ydoc.on("update", (update: Uint8Array, origin: any) => {
      if (origin === "local") {
        socket.emit("sync-update", update);
      }
    });
  });
}

async function main() {
  const clientA = await createClient("A");
  const clientB = await createClient("B");

  console.log("\n--- Client A sends typing-start ---");
  clientA.socket.emit("typing-start");

  setTimeout(() => {
    console.log("\n--- Client B disconnects ---");
    clientB.socket.disconnect();
  }, 1000);

  setTimeout(() => process.exit(0), 2500);
}

main();