import { io, Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

let socket: Socket | null = null;

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

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function reconnectSocket(): void {
  disconnectSocket();
  getSocket();
}
