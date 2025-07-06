const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
let players = [];
let readyCount = 0;

function getRandomPrompt() {
  const imageDir = path.join(__dirname, "public/images");
  const files = fs.readdirSync(imageDir).filter(f => f.endsWith(".png"));
  const file = files[Math.floor(Math.random() * files.length)];
  return "/images/" + file;
}

io.on("connection", socket => {
  socket.on("joinLobby", name => {
    if (players.length >= 3) return;

    const player = { id: socket.id, name, ready: false };
    players.push(player);
    io.emit("lobbyUpdate", players);
  });

  socket.on("playerReady", () => {
    const player = players.find(p => p.id === socket.id);
    if (player) {
      player.ready = true;
      io.emit("lobbyUpdate", players);
    }

    if (players.every(p => p.ready) && players.length > 0) {
		const promptImage = getRandomPrompt();
		io.emit("startGame", promptImage);
	}

  socket.on("disconnect", () => {
    players = players.filter(p => p.id !== socket.id);
    io.emit("lobbyUpdate", players);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});