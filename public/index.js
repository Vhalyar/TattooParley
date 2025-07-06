const socket = io();
let playerName = "";

document.getElementById("joinBtn").onclick = () => {
  playerName = document.getElementById("nameInput").value.trim();
  if (playerName) {
    socket.emit("joinLobby", playerName);
  }
};

document.getElementById("readyBtn").onclick = () => {
  socket.emit("playerReady");
};

socket.on("lobbyUpdate", players => {
  document.getElementById("nameScreen").style.display = "none";
  document.getElementById("lobbyScreen").style.display = "block";

  const list = document.getElementById("playerList");
  list.innerHTML = "";
  players.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML = `<span style="color:${p.color}">${p.name}</span> ${p.ready ? "(Ready)" : ""}`;
    list.appendChild(li);
  });
});

socket.on("startGame", promptImage => {
  document.getElementById("lobbyScreen").style.display = "none";
  document.getElementById("gameScreen").style.display = "block";
  document.getElementById("promptImage").src = promptImage;

  // Ask server what our assigned color is
  socket.emit("requestPlayerColor");

  // Drawing canvas setup
  const canvas = document.getElementById("drawCanvas");
  const ctx = canvas.getContext("2d");
  let drawing = false;

  canvas.onmousedown = () => drawing = true;
  canvas.onmouseup = () => drawing = false;
  canvas.onmouseleave = () => drawing = false;
  canvas.onmousemove = (e) => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(e.clientX - rect.left, e.clientY - rect.top, 2, 0, 2 * Math.PI);
    ctx.fill();
  };
});

socket.on("yourColor", color => {
  const canvas = document.getElementById("drawCanvas");
  canvas.style.border = `4px solid ${color}`;
});