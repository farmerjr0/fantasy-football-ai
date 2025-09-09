// --- Advance snake turn ---
function advanceTurn() {
  // Move within the round
  currentTeamIndex += direction;

  // Flip direction at edges
  if (currentTeamIndex >= totalTeams) {
    direction = -1;
    currentTeamIndex = totalTeams - 1;
    currentRound++;
  } else if (currentTeamIndex < 0) {
    direction = 1;
    currentTeamIndex = 0;
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

  // STOP if we've reached the limit
  if (picksMade >= totalPicks || currentRound > rounds) {
    $playersHint.textContent = "✅ Draft complete.";
    highlightTeamOnClock();
    updateStatusHeader();
    renderPlayers(); // freeze list
    return;
  }

  // Next turn
  advanceTurn();

  // If we advanced past allowed rounds, stop here too
  if (currentRound > rounds) {
    $playersHint.textContent = "✅ Draft complete.";
    highlightTeamOnClock();
    updateStatusHeader();
    renderPlayers();
    return;
  }

  highlightTeamOnClock();
  updateStatusHeader();
  renderPlayers();

  if (!isUserTurn()) {
    setTimeout(aiPick, AIDelayMs);
  }
}
