let availablePlayers = [];
let teams = [];
let currentPick = 0; // overall pick number
const totalTeams = 10;
const rounds = 10; // each team gets 10 players
let picksThisRound = 0;

// Load players
fetch("data/rankings.json")
  .then(response => response.json())
  .then(players => {
    availablePlayers = players;
    setupTeams();
    renderPlayers();
    renderTeams();
    updateStatus();
  });

// Setup teams (1 user + 9 AI)
function setupTeams() {
  for (let i = 0; i < totalTeams; i++) {
    teams.push({
      name: i === 0 ? "You" : `AI Team ${i}`,
      roster: []
    });
  }
}

// Render available players
function renderPlayers() {
  const list = document.getElementById("players-list");
  list.innerHTML = "";
  availablePlayers.forEach(player => {
    const li = document.createElement("li");
    li.textContent = `${player.name} (${player.position}, ${player.team})`;
    if (isUserTurn()) {
      li.style.cursor = "pointer";
      li.onclick = () => draftPlayer(player.id);
    }
    list.appendChild(li);
  });
}

// Render all teams
function renderTeams() {
  const container = document.getElementById("teams-container");
  container.innerHTML = "";
  teams.forEach(team => {
    const div = document.createElement("div");
    div.classList.add("team");
    const heading = document.createElement("h3");
    heading.textContent = team.name;
    div.appendChild(heading);

    const ul = document.createElement("ul");
    team.roster.forEach(player => {
      const li = document.createElement("li");
      li.textContent = `${player.name} (${player.position}, ${player.team})`;
      ul.appendChild(li);
    });

    div.appendChild(ul);
    container.appendChild(div);
  });
}

// Draft a player
function draftPlayer(id) {
  const player = availablePlayers.find(p => p.id === id);
  if (!player) return;

  const teamIndex = getCurrentTeamIndex();
  teams[teamIndex].roster.push(player);

  availablePlayers = availablePlayers.filter(p => p.id !== id);

  currentPick++;
  picksThisRound++;

  renderPlayers();
  renderTeams();
  updateStatus();

  if (!isUserTurn() && !draftComplete()) {
    setTimeout(aiPick, 1000);
  }
}
function aiPick() {
  if (availablePlayers.length === 0) return;

  const aiChoice = availablePlayers[0]; // simple AI: best available
  draftPlayer(aiChoice.id);
}

// AI picks best available
function aiPick() {
  if (availablePlayers.length === 0) return;
  const aiChoice = availablePlayers[0];
  draftPlayer(aiChoice.id);
}

// Who's turn is it?
function getCurrentTeamIndex() {
  const round = Math.floor(currentPick / totalTeams);
  const pickInRound = currentPick % totalTeams;

  // Snake draft order
  return round % 2 === 0 ? pickInRound : totalTeams - 1 - pickInRound;
}

function isUserTurn() {
  return getCurrentTeamIndex() === 0;
}

function draftComplete() {
  return currentPick >= totalTeams * rounds;
}

// Update status
function updateStatus() {
  const status = document.getElementById("draft-status");
  if (draftComplete()) {
    status.textContent = "Draft complete!";
  } else if (isUserTurn()) {
    status.textContent = "It's your turn to draft!";
  } else {
    status.textContent = `${teams[getCurrentTeamIndex()].name} is picking...`;
  }
}
function isUserTurn() {
  return currentPick % totalTeams === 0; // Team 0 = human
}
