const socket = io();
let isDrawingAllowed = true;
let submitted = false;

document.getElementById("joinBtn").onclick = () => {
  const name = document.getElementById("nameInput").value.trim();
  if (name) {
    sessionStorage.setItem("playerName", name);
    socket.emit("joinLobby", name);
  }
};

socket.on("lobbyFull", () => {
  alert("The lobby is full. Please try again later.");
});

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

  socket.emit("requestPlayerColor");

  const canvas = document.getElementById("drawCanvas");
  const ctx = canvas.getContext("2d");
  let drawing = false;
  isDrawingAllowed = true;
  submitted = false;

  canvas.onmousedown = () => {
    if (!isDrawingAllowed) return;
    drawing = true;
  };
  canvas.onmouseup = () => drawing = false;
  canvas.onmouseleave = () => drawing = false;
  canvas.onmousemove = (e) => {
    if (!drawing || !isDrawingAllowed) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(e.clientX - rect.left, e.clientY - rect.top, 2, 0, 2 * Math.PI);
    ctx.fill();
  };

  // Timer logic
  let timeLeft = 60;
  const timerText = document.getElementById("timerText");
  timerText.textContent = `Time left: ${timeLeft}s`;

  const interval = setInterval(() => {
    timeLeft--;
    timerText.textContent = `Time left: ${timeLeft}s`;

    if (timeLeft <= 0 && !submitted) {
      clearInterval(interval);
      timerText.textContent = "Time's up!";
      isDrawingAllowed = false;
      submitted = true;

      const canvasData = canvas.toDataURL("image/png");
      socket.emit("submitDrawing", { image: canvasData });

      document.getElementById("gameScreen").style.display = "none";
      document.body.insertAdjacentHTML("beforeend", "<p id='waitMsg'>Waiting for other players to finish...</p>");
    }
  }, 1000);
});

socket.on("yourColor", color => {
  const canvas = document.getElementById("drawCanvas");
  canvas.style.border = `4px solid ${color}`;
});

socket.on("startVoting", ({ prompt, drawings }) => {
  document.getElementById("waitMsg")?.remove();
  document.getElementById("votingScreen").style.display = "block";
  document.getElementById("votePromptImage").src = prompt;

  const container = document.getElementById("drawingsContainer");
  container.innerHTML = "";

  drawings.forEach(d => {
    const div = document.createElement("div");
    div.style.border = `3px solid ${d.color}`;
    div.style.margin = "10px";
    div.style.padding = "10px";
    div.style.display = "inline-block";
    div.style.textAlign = "center";

    const img = document.createElement("img");
    img.src = d.image;
    img.style.width = "200px";

    const label = document.createElement("p");
    label.style.color = d.color;
    label.textContent = d.name;

    div.appendChild(img);
    div.appendChild(label);
    container.appendChild(div);
  });
});