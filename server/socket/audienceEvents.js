import { getGame } from "../services/gameService.js";

export function setupAudienceEvents(socket, io) {
  socket.on("audience-join", (data) => {
    const { gameCode } = data;
    const game = getGame(gameCode);
    if (game) {
      socket.join(gameCode);
      socket.emit("audience-joined", { game });
    } else {
      socket.emit("error", { message: "Game not found" });
    }
  });
}
