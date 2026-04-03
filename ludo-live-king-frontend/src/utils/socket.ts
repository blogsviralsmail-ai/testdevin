import { io, Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

let socket: Socket | null = null;
let socketVersion = 0;
const socketChangeListeners: Array<() => void> = [];

export function getSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem("token");
    socket = io(API_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function getSocketVersion(): number {
  return socketVersion;
}

export function onSocketChange(listener: () => void): () => void {
  socketChangeListeners.push(listener);
  return () => {
    const idx = socketChangeListeners.indexOf(listener);
    if (idx >= 0) socketChangeListeners.splice(idx, 1);
  };
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function reconnectSocket(): void {
  disconnectSocket();
  getSocket();
  socketVersion++;
  socketChangeListeners.forEach((fn) => fn());
}
