import { io as ioClient } from "socket.io-client";
import * as Y from "yjs";

// Replace with a real token (from login) and a real document ID (from create/list)
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmNDA3ODQ5Ny1mNmJmLTQxODgtODVjNS0zNTdjNWU4NzkwNzQiLCJpYXQiOjE3ODUwMDM5ODUsImV4cCI6MTc4NTYwODc4NX0.-jsYhpbsnnh3HoTSFpTgiZx-D0ma9lGa4NhBgvzfo90";
const DOC_ID = "1f85a97a-8c48-4fac-8098-64a2dbfc46b8";

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
      console.log(`[${name}] joined, initial content: "${ytext.toString()}"`);
      resolve({ socket, ydoc, ytext });
    });

    socket.on("sync-update", (update: Uint8Array) => {
      Y.applyUpdate(ydoc, new Uint8Array(update));
      console.log(`[${name}] received update, content now: "${ytext.toString()}"`);
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

  console.log("\n--- Both clients joined. Client A types 'Hello' ---");
  clientA.ydoc.transact(() => {
    clientA.ytext.insert(0, "Hello");
  }, "local");

  setTimeout(() => {
    console.log("\n--- Final state check ---");
    console.log(`[A] content: "${clientA.ytext.toString()}"`);
    console.log(`[B] content: "${clientB.ytext.toString()}"`);
    process.exit(0);
  }, 1500);
}

main();