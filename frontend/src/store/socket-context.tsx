import React, { createContext, useRef } from "react";
import { Socket } from "socket.io-client";

type ContainerProps = {
  children: React.ReactNode;
};

type SocketContextType = {
  socketRef: React.MutableRefObject<Socket | null>;
};

const SocketContext = createContext<SocketContextType | null>(null);

const SocketProvider: React.FC<ContainerProps> = ({ children }) => {
  const socketRef = useRef<Socket | null>(null);

  return (
    <SocketContext.Provider value={{ socketRef }}>
      {children}
    </SocketContext.Provider>
  );
};

export { SocketContext, SocketProvider };
