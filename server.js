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
let drawingSubmissions = [];
let currentPrompt = "";

function getRandomPrompt() {
  const imageDir = path.join(__dirname, "public/images");
  const files = fs.readdirSync(imageDir).filter(f => f.endsWith(".png"));
  const file = files[Math.floor(Math.random() * files.length)];
  return "/images/" + file;
}

function getRandomColor() {
  const colors = ["#e6194B", "#3cb44b", "#ffe119", "#4363d8", "#f58231", "#911eb4"];
  return colors[Math.floor(Math.random() * colors.length)];
}

io.on("connection", socket => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("joinLobby", name => {
    // Prevent duplicate joins
    const alreadyJoined = players.find(p => p.id === socket.id);
    if (alreadyJoined) return;

    if (players.length >= 3) {
      socket.emit("lobbyFull");
      return;
    }

    const player = {
      id: socket.id,
      name,
      color: getRandomColor(),
      ready: false
    };

    players.push(player);
    console.log(`Player joined: ${name} (${socket.id})`);
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
      currentPrompt = promptImage;
      drawingSubmissions = [];
      io.emit("startGame", promptImage);
    }
  });

  socket.on("submitDrawing", ({ image }) => {
    const player = players.find(p => p.id === socket.id);
    if (player) {
      drawingSubmissions.push({
        id: socket.id,
        name: player.name,
        color: player.color,
        image
      });

      if (drawingSubmissions.length === players.length) {
        io.emit("startVoting", {
          prompt: currentPrompt,
          drawings: drawingSubmissions
        });
      }
    }
  });

  socket.on("requestPlayerColor", () => {
    const player = players.find(p => p.id === socket.id);
    if (player) {
      socket.emit("yourColor", player.color);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    players = players.filter(p => p.id !== socket.id);
    io.emit("lobbyUpdate", players);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});