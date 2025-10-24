import { useState, useEffect, useCallback, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { GAME_CONFIG } from "../utils/constants";

export const useSocketConnection = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(
    (gameCode?: string) => {
      if (socket) {
        console.log("Socket already connected");
        return socket;
      }

      console.log("Connecting to socket...");
      const newSocket = io(GAME_CONFIG.SOCKET_URL, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket.id);
        setIsConnected(true);
      });

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected");
        setIsConnected(false);
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      if (gameCode) {
        socketRef.current.emit("host-join", { gameCode });
      }

      return newSocket;
    },
    [socket]
  );

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
  };
};
