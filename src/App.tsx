import { useMemo, useState } from "react";
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

const gameTypeOptions: Record<GameType, { label: string; totalPlayers: number; perTeam: number }> = {
  "5": { label: "5-a-side", totalPlayers: 10, perTeam: 5 },
  "7": { label: "7-a-side", totalPlayers: 14, perTeam: 7 },
  "8": { label: "8-a-side", totalPlayers: 16, perTeam: 8 },
};

const shuffleArray = <T,>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const getVerticalPositions = (perTeam: number) => {
  const leftX = 145;
  const rightX = 395;
  const top = 110;
  const bottom = 750;
  const spacing = perTeam === 1 ? 0 : (bottom - top) / (perTeam - 1);

  const red = Array.from({ length: perTeam }, (_, index) => ({
    x: leftX,
    y: top + index * spacing,
  }));

  const white = Array.from({ length: perTeam }, (_, index) => ({
    x: rightX,
    y: top + index * spacing,
  }));

  return { red, white };
};

const buildPlayers = (names: string[], gameType: GameType): Player[] => {
  const { perTeam } = gameTypeOptions[gameType];
  const shuffledNames = shuffleArray(names);
  const { red, white } = getVerticalPositions(perTeam);

  return shuffledNames.map((name, index) => {
    const team: Team = index < perTeam ? "red" : "white";
    const position = team === "red" ? red[index] : white[index - perTeam];

    return {
      id: index + 1,
      name,
      team,
      x: position.x,
      y: position.y,
    };
  });
};

const regularPlayers = [
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

const getDefaultNames = (gameType: GameType) => {
  const { totalPlayers } = gameTypeOptions[gameType];
  return regularPlayers.slice(0, totalPlayers).join("
");
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function App() {
  const [customName, setCustomName] = useState("");
  const [step, setStep] = useState<"setup" | "pitch">("setup");
  const [gameType, setGameType] = useState<GameType>("8");
  const [namesInput, setNamesInput] = useState(getDefaultNames("8"));
  const [players, setPlayers] = useState<Player[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const config = gameTypeOptions[gameType];

  const parsedNames = useMemo(
    () => namesInput.split("
").map((name) => name.trim()).filter(Boolean),
    [namesInput]
  );

  const isValidCount = parsedNames.length === config.totalPlayers;
  const redCount = players.filter((player) => player.team === "red").length;
  const whiteCount = players.filter((player) => player.team === "white").length;

  const handleGameTypeChange = (nextType: GameType) => {
    setGameType(nextType);

    const nextDefaultNames = regularPlayers.slice(0, gameTypeOptions[nextType].totalPlayers);
    const currentCustomNames = namesInput
      .split("
")
      .map((name) => name.trim())
      .filter(Boolean)
      .filter((name) => !regularPlayers.includes(name));

    setNamesInput([...nextDefaultNames, ...currentCustomNames].slice(0, gameTypeOptions[nextType].totalPlayers).join("
"));
  };

  const addCustomName = () => {
    const cleaned = customName.trim();
    if (!cleaned) return;

    const formatted = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
    const existing = namesInput
      .split("
")
      .map((name) => name.trim())
      .filter(Boolean);

    if (existing.includes(formatted)) {
      setCustomName("");
      return;
    }

    setNamesInput([...existing, formatted].join("
"));
    setCustomName("");
  };

  const toggleRegularPlayer = (name: string) => {
    const existing = namesInput
      .split("
")
      .map((playerName) => playerName.trim())
      .filter(Boolean);

    if (existing.includes(name)) {
      setNamesInput(existing.filter((playerName) => playerName !== name).join("
"));
      return;
    }

    if (existing.length >= config.totalPlayers) return;
    setNamesInput([...existing, name].join("
"));
  };

  const startBoard = () => {
    if (!isValidCount) return;
    setPlayers(buildPlayers(parsedNames, gameType));
    setStep("pitch");
  };

  const resetSetup = () => {
    setStep("setup");
    setPlayers([]);
    setDraggingId(null);
  };

  const reshuffleTeams = () => {
    setPlayers(buildPlayers(parsedNames, gameType));
    setDraggingId(null);
  };

  const handleDragStart = (id: number) => {
    setDraggingId(id);
  };

  const handleDropOnPitch = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (draggingId === null) return;

    const pitchRect = event.currentTarget.getBoundingClientRect();
    const markerSize = 58;
    const x = clamp(event.clientX - pitchRect.left - markerSize / 2, 8, pitchRect.width - markerSize - 8);
    const y = clamp(event.clientY - pitchRect.top - markerSize / 2, 8, pitchRect.height - markerSize - 8);
    const halfway = pitchRect.width / 2;
    const team: Team = x + markerSize / 2 < halfway ? "red" : "white";

    setPlayers((current) =>
      current.map((player) =>
        player.id === draggingId
          ? {
              ...player,
              x,
              y,
              team,
            }
          : player
      )
    );

    setDraggingId(null);
  };

  return (
    <div className="app-shell">
      {step === "setup" ? (
        <div className="setup-page">
          <div className="setup-card">
            <h1>Lineup Builder</h1>
            <p className="setup-copy">
              Pick the match format, add all player names, then generate two evenly split teams on a vertical pitch.
            </p>

            <div className="format-row">
              {(["5", "7", "8"] as GameType[]).map((type) => (
                <button
                  key={type}
                  className={`format-button ${gameType === type ? "active" : ""}`}
                  onClick={() => handleGameTypeChange(type)}
                >
                  {gameTypeOptions[type].label}
                  <span>{gameTypeOptions[type].totalPlayers} players</span>
                </button>
              ))}
            </div>

            <div className="names-header">
              <h2>Player names</h2>
              <span>
                Select or add exactly <strong>{config.totalPlayers}</strong> names
              </span>
            </div>

            <div className="regular-players-grid">
              {regularPlayers.map((name) => {
                const selected = parsedNames.includes(name);
                const disabled = !selected && parsedNames.length >= config.totalPlayers;

                return (
                  <button
                    key={name}
                    type="button"
                    className={`player-chip ${selected ? "selected" : ""}`}
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
              <button type="button" className="secondary-button" onClick={addCustomName}>
                Add name
              </button>
            </div>

            <textarea
              className="names-input"
              value={namesInput}
              onChange={(e) => setNamesInput(e.target.value)}
              placeholder="One player name per line"
            />

            <div className="status-row">
              <div className={`status-pill ${isValidCount ? "ok" : "warn"}`}>
                {parsedNames.length} / {config.totalPlayers} players
              </div>
              <div className="status-hint">
                Teams will be shuffled into {config.perTeam} red and {config.perTeam} white players.
              </div>
            </div>

            <button className="primary-button" onClick={startBoard} disabled={!isValidCount}>
              Generate teams
            </button>
          </div>
        </div>
      ) : (
        <div className="pitch-page">
          <div className="topbar">
            <div>
              <h1>{config.label} team board</h1>
              <p>Drag a player left or right to switch teams automatically.</p>
            </div>

            <div className="topbar-actions">
              <div className="team-count red-count">Red: {redCount}</div>
              <div className="team-count white-count">White: {whiteCount}</div>
              <button className="secondary-button" onClick={reshuffleTeams}>Reshuffle</button>
              <button className="secondary-button" onClick={resetSetup}>Back</button>
            </div>
          </div>

          <div
            className="vertical-pitch"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropOnPitch}
          >
            <div className="pitch-half left-half"></div>
            <div className="pitch-half right-half"></div>
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
                className={`player-marker ${player.team}`}
                draggable
                onDragStart={() => handleDragStart(player.id)}
                style={{ left: player.x, top: player.y }}
              >
                <span>{player.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
