import { useState } from "react";
import "./App.css";

type Team = "red" | "white";
type GameType = "5" | "7" | "8";

type Player = {
  id: number;
  name: string;
  team: Team;
  x: number;
  y: number;
};

const regularPlayers: string[] = [
  "Hardik",
  "Mez",
  "Harj",
  "Suj",
  "Abi",
  "Arnie",
  "Callum",
  "Prem",
  "Shyam",
  "Kunal",
  "Pranav",
  "Josh",
  "Kiran",
  "Pranny",
  "Sukh",
  "Dil",
  "Sandeep",
  "Amraj",
];

const gameTypeOptions: Record<
  GameType,
  { label: string; totalPlayers: number; perTeam: number }
> = {
  "5": { label: "5-a-side", totalPlayers: 10, perTeam: 5 },
  "7": { label: "7-a-side", totalPlayers: 14, perTeam: 7 },
  "8": { label: "8-a-side", totalPlayers: 16, perTeam: 8 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function shuffleNames(names: string[]): string[] {
  const arr = [...names];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

function getDefaultNames(gameType: GameType): string[] {
  return regularPlayers.slice(0, gameTypeOptions[gameType].totalPlayers);
}

function buildPlayers(names: string[], gameType: GameType): Player[] {
  const shuffled = shuffleNames(names);
  const perTeam = gameTypeOptions[gameType].perTeam;

  const topYs =
    perTeam === 5
      ? [110, 180, 250, 320, 390]
      : perTeam === 7
      ? [100, 160, 220, 280, 340, 400, 460]
      : [95, 145, 195, 245, 295, 345, 395, 445];

  const bottomYs =
    perTeam === 5
      ? [500, 570, 640, 710, 780]
      : perTeam === 7
      ? [390, 450, 510, 570, 630, 690, 750]
      : [385, 435, 485, 535, 585, 635, 685, 735];

  const topXs =
    perTeam === 5
      ? [250, 150, 350, 190, 310]
      : perTeam === 7
      ? [250, 150, 350, 120, 380, 190, 310]
      : [250, 150, 350, 120, 380, 170, 330, 250];

  const bottomXs =
    perTeam === 5
      ? [250, 150, 350, 190, 310]
      : perTeam === 7
      ? [250, 150, 350, 120, 380, 190, 310]
      : [250, 150, 350, 120, 380, 170, 330, 250];

  return shuffled.map((name, index) => {
    if (index < perTeam) {
      return {
        id: index + 1,
        name,
        team: "red",
        x: topXs[index],
        y: topYs[index],
      };
    }

    const i = index - perTeam;
    return {
      id: index + 1,
      name,
      team: "white",
      x: bottomXs[i],
      y: bottomYs[i],
    };
  });
}

export default function App() {
  const [step, setStep] = useState<"setup" | "pitch">("setup");
  const [gameType, setGameType] = useState<GameType>("8");
  const [selectedNames, setSelectedNames] = useState<string[]>(
    getDefaultNames("8")
  );
  const [customName, setCustomName] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const config = gameTypeOptions[gameType];
  const isValidCount = selectedNames.length === config.totalPlayers;
  const redCount = players.filter((p) => p.team === "red").length;
  const whiteCount = players.filter((p) => p.team === "white").length;

  function handleGameTypeChange(nextType: GameType) {
    setGameType(nextType);
    setSelectedNames(getDefaultNames(nextType));
    setCustomName("");
  }

  function toggleRegularPlayer(name: string) {
    const exists = selectedNames.includes(name);

    if (exists) {
      setSelectedNames(selectedNames.filter((n) => n !== name));
      return;
    }

    if (selectedNames.length >= config.totalPlayers) return;
    setSelectedNames([...selectedNames, name]);
  }

  function addCustomName() {
    const cleaned = customName.trim();
    if (!cleaned) return;

    const formatted =
      cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();

    if (selectedNames.includes(formatted)) {
      setCustomName("");
      return;
    }

    if (selectedNames.length >= config.totalPlayers) return;

    setSelectedNames([...selectedNames, formatted]);
    setCustomName("");
  }

  function removeSelectedName(name: string) {
    setSelectedNames(selectedNames.filter((n) => n !== name));
  }

  function startBoard() {
    if (!isValidCount) return;
    setPlayers(buildPlayers(selectedNames, gameType));
    setStep("pitch");
  }

  function reshuffleTeams() {
    setPlayers(buildPlayers(selectedNames, gameType));
    setDraggingId(null);
  }

  function goBack() {
    setStep("setup");
    setPlayers([]);
    setDraggingId(null);
  }

  function handleDropOnPitch(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (draggingId === null) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = clamp(e.clientX - rect.left, 30, rect.width - 30);
    const y = clamp(e.clientY - rect.top, 30, rect.height - 30);
    const halfway = rect.height / 2;
    const nextTeam: Team = y < halfway ? "red" : "white";

    setPlayers(
      players.map((player) =>
        player.id === draggingId
          ? { ...player, x, y, team: nextTeam }
          : player
      )
    );

    setDraggingId(null);
  }

  if (step === "setup") {
    return (
      <div className="app-shell">
        <div className="setup-page">
          <div className="setup-card">
            <h1>Lineup Builder</h1>
            <p className="setup-copy">
              Choose a format, select players, then generate equal shuffled
              teams on a top-down football pitch.
            </p>

            <div className="format-row">
              {(["5", "7", "8"] as GameType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  className={
                    gameType === type
                      ? "format-button active"
                      : "format-button"
                  }
                  onClick={() => handleGameTypeChange(type)}
                >
                  {gameTypeOptions[type].label}
                  <span>{gameTypeOptions[type].totalPlayers} players</span>
                </button>
              ))}
            </div>

            <div className="names-header">
              <h2>Select players</h2>
              <span>
                Pick exactly <strong>{config.totalPlayers}</strong> players
              </span>
            </div>

            <div className="regular-players-grid">
              {regularPlayers.map((name) => {
                const selected = selectedNames.includes(name);
                const disabled =
                  !selected && selectedNames.length >= config.totalPlayers;

                return (
                  <button
                    key={name}
                    type="button"
                    className={selected ? "player-chip selected" : "player-chip"}
                    onClick={() => toggleRegularPlayer(name)}
                    disabled={disabled}
                  >
                    {name}
                  </button>
                );
              })}
            </div>

            <div className="custom-name-row">
              <input
                className="custom-name-input"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Add a new player name"
              />
              <button
                type="button"
                className="secondary-button"
                onClick={addCustomName}
              >
                Add name
              </button>
            </div>

            <div className="selected-names-box">
              {selectedNames.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="selected-name-tag"
                  onClick={() => removeSelectedName(name)}
                >
                  {name} ×
                </button>
              ))}
            </div>

            <div className="status-row">
              <div className={isValidCount ? "status-pill ok" : "status-pill warn"}>
                {selectedNames.length} / {config.totalPlayers} players
              </div>
              <div className="status-hint">
                Teams will be shuffled into {config.perTeam} vs {config.perTeam}
              </div>
            </div>

            <button
              className="primary-button"
              onClick={startBoard}
              disabled={!isValidCount}
            >
              Generate teams
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="pitch-page">
        <div className="topbar">
          <div>
            <h1>{config.label} team board</h1>
            <p>Drag a player above or below halfway to switch team colour.</p>
          </div>

          <div className="topbar-actions">
            <div className="team-count red-count">Red: {redCount}</div>
            <div className="team-count white-count">White: {whiteCount}</div>
            <button className="secondary-button" onClick={reshuffleTeams}>
              Reshuffle
            </button>
            <button className="secondary-button" onClick={goBack}>
              Back
            </button>
          </div>
        </div>

        <div
          className="vertical-pitch"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropOnPitch}
        >
          <div className="halfway-line"></div>
          <div className="center-circle"></div>
          <div className="center-spot"></div>

          <div className="penalty-box top-box"></div>
          <div className="penalty-box bottom-box"></div>
          <div className="goal-box top-goal-box"></div>
          <div className="goal-box bottom-goal-box"></div>
          <div className="goal top-goal"></div>
          <div className="goal bottom-goal"></div>

          {players.map((player) => (
            <div
              key={player.id}
              className={player.team === "red" ? "player-marker red" : "player-marker white"}
              draggable
              onDragStart={() => setDraggingId(player.id)}
              style={{
                left: `${player.x}px`,
                top: `${player.y}px`,
              }}
            >
              <span>{player.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
