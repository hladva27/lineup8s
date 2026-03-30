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

const gameTypeOptions: Record<
  GameType,
  { label: string; totalPlayers: number; perTeam: number }
> = {
  "5": { label: "5-a-side", totalPlayers: 10, perTeam: 5 },
  "7": { label: "7-a-side", totalPlayers: 14, perTeam: 7 },
  "8": { label: "8-a-side", totalPlayers: 16, perTeam: 8 },
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const shuffleArray = <T,>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const getDefaultNames = (gameType: GameType) => {
  const { totalPlayers } = gameTypeOptions[gameType];
  return regularPlayers.slice(0, totalPlayers);
};

const buildPlayers = (names: string[], gameType: GameType): Player[] => {
  const { perTeam } = gameTypeOptions[gameType];
  const shuffledNames = shuffleArray(names);

  const pitchWidth = 500;
  const pitchHeight = 850;
  const topStartY = 110;
  const topEndY = 360;
  const bottomStartY = 500;
  const bottomEndY = 750;

  const spacingTop = perTeam === 1 ? 0 : (topEndY - topStartY) / (perTeam - 1);
  const spacingBottom =
    perTeam === 1 ? 0 : (bottomEndY - bottomStartY) / (perTeam - 1);

  return shuffledNames.map((name, index) => {
    const team: Team = index < perTeam ? "red" : "white";

    if (team === "red") {
      const i = index;
      const x = i % 2 === 0 ? 170 : 330;
      const row = Math.floor(i / 2);
      return {
        id: index + 1,
        name,
        team,
        x,
        y: topStartY + row * spacingTop,
      };
    }

    const i = index - perTeam;
    const x = i % 2 === 0 ? 170 : 330;
    const row = Math.floor(i / 2);
    return {
      id: index + 1,
      name,
      team,
      x,
      y: bottomStartY + row * spacingBottom,
    };
  });
};

export default function App() {
  const [step, setStep] = useState<"setup" | "pitch">("setup");
  const [gameType, setGameType] = useState<GameType>("8");
  const [selectedNames, setSelectedNames] = useState<string[]>(
    getDefaultNames("8")
  );
  const [customName, setCustomName] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const config = gameTypeOptions[gameType];

  const namesText = useMemo(() => selectedNames.join("\n"), [selectedNames]);

  const isValidCount = selectedNames.length === config.totalPlayers;
  const redCount = players.filter((player) => player.team === "red").length;
  const whiteCount = players.filter((player) => player.team === "white").length;

  const handleGameTypeChange = (nextType: GameType) => {
    setGameType(nextType);
    setSelectedNames(getDefaultNames(nextType));
    setCustomName("");
  };

  const toggleRegularPlayer = (name: string) => {
    const exists = selectedNames.includes(name);

    if (exists) {
      setSelectedNames((current) => current.filter((n) => n !== name));
      return;
    }

    if (selectedNames.length >= config.totalPlayers) return;

    setSelectedNames((current) => [...current, name]);
  };

  const addCustomName = () => {
    const cleaned = customName.trim();
    if (!cleaned) return;

    const formatted =
      cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();

    if (selectedNames.includes(formatted)) {
      setCustomName("");
      return;
    }

    if (selectedNames.length >= config.totalPlayers) return;

    setSelectedNames((current) => [...current, formatted]);
    setCustomName("");
  };

  const removeSelectedName = (name: string) => {
    setSelectedNames((current) => current.filter((n) => n !== name));
  };

  const startBoard = () => {
    if (!isValidCount) return;
    setPlayers(buildPlayers(selectedNames, gameType));
    setStep("pitch");
  };

  const resetSetup = () => {
    setStep("setup");
    setPlayers([]);
    setDraggingId(null);
  };

  const reshuffleTeams = () => {
    setPlayers(buildPlayers(selectedNames, gameType));
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

    const x = clamp(
      event.clientX - pitchRect.left,
      markerSize / 2,
      pitchRect.width - markerSize / 2
    );
    const y = clamp(
      event.clientY - pitchRect.top,
      markerSize / 2,
      pitchRect.height - markerSize / 2
    );

    const halfway = pitchRect.height / 2;
    const team: Team = y < halfway ? "red" : "white";

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
              Choose your format, select players, then generate equal shuffled
              teams on a full top-down pitch.
            </p>

            <div className="format-row">
              {(["5", "7", "8"] as GameType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`format-button ${gameType === type ? "active" : ""}`}
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
                  title="Remove player"
                >
                  {name} ×
                </button>
              ))}
            </div>

            <div className="status-row">
              <div className={`status-pill ${isValidCount ? "ok" : "warn"}`}>
                {selectedNames.length} / {config.totalPlayers} players
              </div>
              <div className="status-hint">
                Teams will be shuffled into {config.perTeam} vs {config.perTeam}
              </div>
            </div>

            <textarea
              className="names-input"
              value={namesText}
              readOnly
            />

            <button
              className="primary-button"
              onClick={startBoard}
              disabled={!isValidCount}
            >
              Generate teams
            </button>
          </div>
        </div>
      ) : (
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
              <button className="secondary-button" onClick={resetSetup}>
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
                className={`player-marker ${player.team}`}
                draggable
                onDragStart={() => handleDragStart(player.id)}
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
      )}
    </div>
  );
}
