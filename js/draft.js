// ===== CLEAN RESET: Minimal, working human-vs-AI snake draft =====

// --- Config ---
const totalTeams = 10;       // number of teams
const rounds     = 10;       // roster size per team
const humanTeamIndex = 0;    // human controls Team 1 (index 0)
const AIDelayMs = 900;       // slight delay so AI picks are visible

// --- State ---
let availablePlayers = [];           // remaining pool (sorted by rank)
let teams = [];                      // [{name, roster: []}]
let currentRound = 1;
let currentTeamIndex = 0;            // 0..totalTeams-1
let direction = 1;                   // 1 = forward (1..N), -1 = backward (N..1)
let picksMade = 0;
const totalPicks = totalTeams * rounds;

// --- DOM ---
const $playersList  = document.getElementById("players-list");
const $teamsGrid    = document.getElementById("teamsGrid");
const $log          = document.getElementById("draft-log");
const $roundNum     = document.getElementById("roundNum");
const $pickNum      = document.getElementById("pickNum");
const $teamOnClock  = document.getElementById("teamOnClock");
const $playersHint  = document.getElementById("playersHint");

// --- Utils ---
const uid = () => "p_" + Math.random().toString(36).slice(2,10);

// Normalize a player record from rankings.json
function normalizePlayer(p, i) {
  return {
    id: p.id || uid(),
    rank: typeof p.rank === "number" ? p.rank : i + 1,
    name: p.name || p.player || "Unknown",
    position: p.position || p.pos || "UNK",
    team: p.team || p.nfl_team || ""
  };
}

function isUserTurn() { return currentTeamIndex === humanTeamIndex; }

function currentPickNumber() { return picksMade + 1; }

// --- Init teams + board ---
function setupTeams() {
  teams = [];
  for (let i = 0; i < totalTeams; i++) {
    teams.push({
      name: i === humanTeamIndex ? "Team 1 (You)" : `AI Team ${i+1}`,
      roster: []
    });
  }
  renderTeamsGrid();
  highlightTeamOnClock();
}

// Build team boxes
function renderTeamsGrid() {
  $teamsGrid.innerHTML = "";
  teams.forEach((t, idx) => {
    const box = document.createElement("div");
    box.className = "teamBox";
    box.id = `teamBox-${idx}`;
    box.innerHTML = `
      <h3>${t.name}</h3>
      <ul id="roster-${idx}"></ul>
    `;
    $teamsGrid.appendChild(box);
  });
}

// Update the single team’s roster list
function renderTeamRoster(idx) {
  const ul = document.getElementById(`roster-${idx}`);
  if (!ul) return;
  ul.innerHTML = "";
  teams[idx].roster.forEach(p => {
    const li = document.createElement("li");
    li.textContent = `${p.name} (${p.position}${p.team ? " - " + p.team : ""})`;
    ul.appendChild(li);
  });
}

function highlightTeamOnClock() {
  document.querySelectorAll(".teamBox").forEach(el => el.classList.remove("onClock"));
  const on = document.getElementById(`teamBox-${currentTeamIndex}`);
  if (on) on.classList.add("onClock");
}

// --- Status header ---
function updateStatusHeader() {
  $roundNum.textContent = currentRound;
  $pickNum.textContent  = currentPickNumber();
  const label = teams[currentTeamIndex]?.name || `Team ${currentTeamIndex+1}`;
  $teamOnClock.textContent = label;
  $playersHint.textContent = isUserTurn()
    ? "Click a player to draft."
    : "AI is picking …";
}

// --- Render players list ---
function renderPlayers() {
  $playersList.innerHTML = "";
  availablePlayers.forEach(p => {
    const li = document.createElement("li");
    li.textContent = `#${p.rank} — ${p.name} (${p.position}${p.team ? " - " + p.team : ""})`;

    if (isUserTurn()) {
      li.classList.add("clickable");
      li.onclick = () => draftPlayer(p.id);   // human click to draft
    } else {
      li.onclick = null;
      li.classList.remove("clickable");
    }

    $playersList.appendChild(li);
  });
}

// --- Log pick ---
function logPick(teamIdx, round, player) {
  const li = document.createElement("li");
  li.textContent = `Round ${round}: ${teams[teamIdx].name} drafted ${player.name} (${player.position}${player.team ? " - " + player.team : ""})`;
  $log.appendChild(li);
  $log.scrollTop = $log.scrollHeight;
}

// --- Advance snake turn ---
function advanceTurn() {
  // Move within the round
  currentTeamIndex += direction;

  // Hit an edge? flip direction and advance round
  if (currentTeamIndex >= totalTeams) {
    direction = -1;
    currentTeamIndex = totalTeams - 1; // stay at last
    currentRound++;
  } else if (currentTeamIndex < 0) {
    direction = 1;
    currentTeamIndex = 0; // stay at first
    currentRound++;
  }
}

// --- Core draft action used by human + AI ---
function performPick(playerId) {
  const idx = availablePlayers.findIndex(p => p.id === playerId);
  if (idx === -1) return;

  const player = availablePlayers.splice(idx, 1)[0];

  teams[currentTeamIndex].roster.push(player);
  renderTeamRoster(currentTeamIndex);
  logPick(currentTeamIndex, currentRound, player);

  picksMade++;

  // Done?
  if (picksMade >= totalPicks) {
    updateStatusHeader();
    $playersHint.textContent = "Draft complete.";
    // freeze list
    renderPlayers();
    highlightTeamOnClock();
    return;
  }

  // Next turn
  advanceTurn();
  highlightTeamOnClock();
  updateStatusHeader();
  renderPlayers();

  // If AI's turn, pick after small delay
  if (!isUserTurn()) {
    setTimeout(aiPick, AIDelayMs);
  }
}

// --- Human pick (click handler) ---
function draftPlayer(playerId) {
  if (!isUserTurn()) return; // safety
  performPick(playerId);
}

// --- AI pick: best available (by rank) ---
function aiPick() {
  if (isUserTurn()) return; // safety
  if (availablePlayers.length === 0) return;

  const best = availablePlayers[0]; // already sorted by rank
  performPick(best.id);
}

// --- Load players and start ---
function start() {
  fetch("../data/rankings.json", { cache: "no-store" })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(list => {
      availablePlayers = (Array.isArray(list) ? list : [])
        .map(normalizePlayer)
        .sort((a,b) => (a.rank ?? 9999) - (b.rank ?? 9999));

      setupTeams();
      // Render initial rosters (empty) so boxes exist:
      for (let i = 0; i < totalTeams; i++) renderTeamRoster(i);

      updateStatusHeader();
      renderPlayers();

      // If AI happens to start, let them pick; else wait for human click
      if (!isUserTurn()) setTimeout(aiPick, AIDelayMs);
    })
    .catch(err => {
      console.error("Failed to load ../data/rankings.json:", err);
      $playersList.innerHTML = `<li style="color:#b00020;">Could not load player pool. Ensure <code>data/rankings.json</code> is valid JSON and deploy again.</li>`;
    });
}

start();
