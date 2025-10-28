import { useEffect, useCallback, useState } from "react";
import io, { Socket } from "socket.io-client";
import { GAME_CONFIG } from "../utils/constants";
import { Game } from "../types/index";
import { getTeamName } from "../utils/gameHelper";

export const useSetupSocket = (
  socketRef: React.MutableRefObject<Socket | null>
) => {
  const [isConnected, setIsConnected] = useState(false); 

  const connect = useCallback(
    (
      gameCode: string,
      isHost?: boolean,
      setGame?: React.Dispatch<React.SetStateAction<Game | null>>,
      setControlMessage?: React.Dispatch<React.SetStateAction<string>>
    ) => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      const socket = io(GAME_CONFIG.SOCKET_URL, {
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 5004,
      });

      socket.on("connect", () => {
        console.log("Socket connected:", socket.id);
        setIsConnected(true); 

        if (isHost) {
          socket.emit("host-join", { gameCode });
        }
      });

      socket.on("disconnect", () => {
        console.log("Socket disconnected");
        setIsConnected(false); 
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setIsConnected(false);
      });

      if (isHost) {
        socket.on("host-joined", (data) => {
          console.log("Host joined successfully! Game data:", data);
          const { game: gameData, activeTeam } = data;
          console.log("HOST JOINED THE GAME");
          setGame?.(gameData);

          if (gameData.status === "active") {
            if (activeTeam) {
              const teamName = getTeamName(gameData, activeTeam);
              setControlMessage?.(
                `Rejoined game in progress. ${teamName} goes now.`
              );
            } else {
              setControlMessage?.(
                "Rejoined game in progress. Waiting for buzz."
              );
            }
          } else if (gameData.status === "round-summary") {
            setControlMessage?.(
              `Round ${gameData.currentRound} completed! Ready for next round.`
            );
          } else {
            setControlMessage?.("Waiting for players to join...");
          }

          // Request current players list
          socket.emit("get-players", { gameCode });
        });
      }

      socketRef.current = socket;
    },
    [socketRef]
  );

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, [socketRef]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { connect, disconnect, isConnected };
};
